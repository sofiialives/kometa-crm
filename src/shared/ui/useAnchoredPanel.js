import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Всплывающая панель, привязанная к полю: календарь, выпадающий список.
 *
 * Почему порталом и на fixed. Внутри Modal у тела окна стоит overflow-y:auto,
 * и обычная absolute-всплывашка обрезается по нижнему краю — у календаря так
 * пропадала последняя неделя месяца.
 *
 * Почему слежение каждый кадр, а не подписка на scroll и resize. Поле уезжает
 * не только от прокрутки: страница перестраивается сама — приходят данные,
 * меняется режим, раскрывается пустое состояние, переносится строка. Никакого
 * события при этом не происходит, и панель, посчитанная один раз, остаётся
 * висеть в стороне. Именно это выглядело как «дропдаун прыгает».
 *
 * Кадр стоит одного getBoundingClientRect, а состояние обновляется только
 * когда координаты реально изменились, — лишних перерисовок нет. Панель живёт
 * секунды, так что цена этого слежения незаметна.
 */
export function useAnchoredPanel({ width, height = 280, gap = 6 } = {}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const boxRef = useRef(null)
  const panelRef = useRef(null)
  const posRef = useRef(null)

  // Сторону выбираем один раз при открытии и больше не меняем. Переворот на
  // ходу — это и есть прыжок: панель телепортируется из-под поля наверх,
  // стоит содержимому над ней подрасти. Если места не хватает, просто
  // прижимаем панель к краю экрана, оставаясь на выбранной стороне.
  const side = useRef('below')

  const measure = useCallback(() => {
    const r = boxRef.current?.getBoundingClientRect()
    if (!r) return null

    // Поле ушло с экрана целиком — держать панель над чужим содержимым незачем.
    if (r.bottom < 0 || r.top > window.innerHeight) return 'gone'

    const w = width ?? r.width

    // Места на выбранной стороне может не хватать — например, страница
    // подросла и поле уехало вниз. Тогда панель не переворачивается и не
    // налезает на поле, а сжимается: содержимое внутри прокручивается.
    const room = side.current === 'below'
      ? window.innerHeight - r.bottom - gap - 8
      : r.top - gap - 8

    const maxHeight = Math.max(120, Math.min(height, room))
    const top = side.current === 'below' ? r.bottom + gap : Math.max(8, r.top - maxHeight - gap)

    return {
      width: Math.round(w),
      left: Math.round(Math.max(8, Math.min(r.left, window.innerWidth - w - 8))),
      top: Math.round(top),
      maxHeight: Math.round(maxHeight),
    }
  }, [width, height, gap])

  useEffect(() => {
    if (!open) { setPos(null); posRef.current = null; return undefined }

    const r = boxRef.current?.getBoundingClientRect()
    side.current = r && window.innerHeight - r.bottom < height && r.top >= height ? 'above' : 'below'

    let frame
    const tick = () => {
      const next = measure()
      if (next === 'gone') { setOpen(false); return }
      if (next) {
        const prev = posRef.current
        if (!prev || prev.top !== next.top || prev.left !== next.left
          || prev.width !== next.width || prev.maxHeight !== next.maxHeight) {
          posRef.current = next
          setPos(next)
        }
      }
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [open, measure, height])

  useEffect(() => {
    if (!open) return undefined
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
