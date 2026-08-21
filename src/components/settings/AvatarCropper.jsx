import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Button } from '../../shared/ui'

const BOX = 260          // диаметр круга в окне кадрирования
const OUT = 320          // сторона готовой картинки
const MAX_ZOOM = 4

/*
 * Кадрирование фото под круглую аватарку. Раньше картинка просто ужималась
 * целиком, а круг обрезал её по центру: у вертикального снимка голова
 * уезжала за край. Теперь человек сам ставит кадр — тянет фото мышью или
 * пальцем и меняет масштаб.
 *
 * Смещение храним в координатах исходной картинки, а не экрана: иначе при
 * смене масштаба кадр прыгает.
 */
export function AvatarCropper({ file, onCancel, onDone }) {
  const [src, setSrc] = useState(null)
  const [img, setImg] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [error, setError] = useState(null)
  const dragRef = useRef(null)

  useEffect(() => {
    if (!file) { setSrc(null); setImg(null); setError(null); return }
    if (!file.type.startsWith('image/')) { setError('Выберите файл изображения'); return }

    const reader = new FileReader()
    reader.onerror = () => setError('Не удалось прочитать файл')
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => setError('Файл повреждён или не является изображением')
      image.onload = () => {
        setImg(image)
        setZoom(1)
        setOffset({ x: 0, y: 0 })
        setError(null)
      }
      image.src = reader.result
      setSrc(reader.result)
    }
    reader.readAsDataURL(file)
  }, [file])

  // Масштаб, при котором картинка ровно закрывает круг — от него и пляшем.
  const baseScale = img ? BOX / Math.min(img.width, img.height) : 1
  const scale = baseScale * zoom

  // Не даём утащить фото так, чтобы в круге появилась пустота.
  const clamp = useCallback((next, z) => {
    if (!img) return next
    const s = baseScale * z
    const limitX = Math.max(0, (img.width * s - BOX) / 2 / s)
    const limitY = Math.max(0, (img.height * s - BOX) / 2 / s)
    return {
      x: Math.min(limitX, Math.max(-limitX, next.x)),
      y: Math.min(limitY, Math.max(-limitY, next.y)),
    }
  }, [img, baseScale])

  function startDrag(e) {
    if (!img) return
    const point = e.touches?.[0] || e
    dragRef.current = { x: point.clientX, y: point.clientY, from: offset, scale }
  }

  useEffect(() => {
    if (!file) return
    function move(e) {
      const drag = dragRef.current
      if (!drag) return
      const point = e.touches?.[0] || e
      const dx = (point.clientX - drag.x) / drag.scale
      const dy = (point.clientY - drag.y) / drag.scale
      setOffset(clamp({ x: drag.from.x + dx, y: drag.from.y + dy }, zoom))
    }
    function up() { dragRef.current = null }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
  }, [file, clamp, zoom])

  function changeZoom(value) {
    const z = Number(value)
    setZoom(z)
    setOffset((o) => clamp(o, z))
  }

  function apply() {
    if (!img) return
    const canvas = document.createElement('canvas')
    canvas.width = OUT
    canvas.height = OUT
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'

    // Переносим то, что видно в круге, на квадрат OUT×OUT.
    const k = OUT / BOX
    ctx.translate(OUT / 2, OUT / 2)
    ctx.scale(scale * k, scale * k)
    ctx.drawImage(img, -img.width / 2 + offset.x, -img.height / 2 + offset.y)

    onDone(canvas.toDataURL('image/jpeg', 0.85))
  }

  return (
    <Modal
      open={Boolean(file)}
      onClose={onCancel}
      title="Кадр фотографии"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>Отмена</Button>
          <Button disabled={!img} onClick={apply}>Поставить фото</Button>
        </>
      }
    >
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            style={{ width: BOX, height: BOX }}
            className="relative overflow-hidden rounded-full border border-line-2 bg-panel-2 cursor-grab active:cursor-grabbing touch-none select-none"
          >
            {src && (
              <img
                src={src}
                alt=""
                draggable="false"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: img ? img.width * scale : 'auto',
                  height: img ? img.height * scale : 'auto',
                  maxWidth: 'none',
                  transform: `translate(-50%, -50%) translate(${offset.x * scale}px, ${offset.y * scale}px)`,
                }}
              />
            )}
          </div>

          <label className="flex w-full items-center gap-3">
            <span className="caption shrink-0">Масштаб</span>
            <input
              type="range"
              min="1"
              max={MAX_ZOOM}
              step="0.01"
              value={zoom}
              onChange={(e) => changeZoom(e.target.value)}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-panel-2 accent-accent"
              aria-label="Масштаб фотографии"
            />
          </label>

          <p className="text-xs text-ink-3 text-center">
            Потяните фото, чтобы выбрать кадр. Ползунком меняется масштаб.
          </p>
        </div>
      )}
    </Modal>
  )
}
