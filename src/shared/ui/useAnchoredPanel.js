import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Всплывающая панель, привязанная к полю: календарь, выпадающий список.
 *
 * Почему порталом и на fixed. Внутри Modal у тела окна стоит overflow-y:auto,
 * и обычная absolute-всплывашка обрезается по нижнему краю — у календаря так
 * пропадала последняя неделя месяца.
 *
 * Почему пересчёт при прокрутке. Панель на fixed не двигается сама, а поле
 * уезжает — и она от него отрывается. На телефоне, где прокрутка почти
 * всегда, это выглядит как прыгающее меню.
 *
 * Слушаем в фазе захвата: прокручивается не только окно. У тела модального
 * окна свой overflow, а поля стоят и внутри модалок.
 *
 * Одна механика на все всплывашки: иначе тот же прыжок пришлось бы ловить
 * в каждой заново.
 */
export function useAnchoredPanel({ width, height = 280, gap = 6 } = {}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const boxRef = useRef(null)
  const panelRef = useRef(null)
  // Сторону выбираем один раз при открытии и держим, пока панель открыта.
  // Пересчитывать её на каждый кадр прокрутки значит перебрасывать панель
  // над полем и под него, стоит месту снизу появиться или кончиться, — а
  // это и есть то самое «прыгает».
  const side = useRef('below')

  const place = useCallback(() => {
    const r = boxRef.current?.getBoundingClientRect()
    if (!r) return

    // Поле ушло с экрана целиком — держать панель над чужим содержимым
    // незачем.
    if (r.bottom < 0 || r.top > window.innerHeight) { setOpen(false); return }

    const w = width ?? r.width
    const below = window.innerHeight - r.bottom
    const above = r.top

    // Переворачиваем только тогда, когда выбранная сторона перестала
    // вмещать панель вовсе, а противоположная вмещает.
    if (side.current === 'below' && below < height && above >= height) side.current = 'above'
    else if (side.current === 'above' && above < height && below >= height) side.current = 'below'

    setPos({
      width: w,
      left: Math.max(8, Math.min(r.left, window.innerWidth - w - 8)),
      top: side.current === 'below' ? r.bottom + gap : Math.max(8, r.top - height - gap),
    })
  }, [width, height, gap])

  useEffect(() => {
    if (!open) { setPos(null); return }
    // При каждом открытии сторона выбирается заново, по месту на экране.
    const r = boxRef.current?.getBoundingClientRect()
    side.current = r && window.innerHeight - r.bottom < height && r.top >= height ? 'above' : 'below'
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, { capture: true, passive: true })
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, { capture: true })
    }
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (boxRef.current?.contains(e.target)) return
      if (panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    // Escape гасим до всплытия: иначе он закрыл бы заодно и модальное окно,
    // в котором стоит поле.
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return { open, setOpen, pos, boxRef, panelRef }
}
