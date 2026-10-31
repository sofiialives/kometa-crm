import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Badge, Modal, Spinner } from '../../shared/ui'
import { useKhochuPlachuStore } from '../../core/store/khochuPlachuStore'

const STATUS_TONE = { pending: 'warn', approved: 'ok', rejected: 'danger', removed: 'neutral' }
const STATUS_LABEL = { pending: 'На рассмотрении', approved: 'Одобрен', rejected: 'Отклонён', removed: 'Снят с одобренных' }

const MIN_SCALE = 1
const MAX_SCALE = 6
const DOUBLE_TAP_SCALE = 2.5
const DRAG_THRESHOLD = 6
const DOUBLE_TAP_MS = 320
const DOUBLE_TAP_DIST = 32

function clampScale(scale) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

function clampPos(scale, pos, baseRect, stageRect) {
  if (scale <= MIN_SCALE || !baseRect || !stageRect) return { x: 0, y: 0 }
  const w = baseRect.width * scale
  const h = baseRect.height * scale
  const maxX = Math.max(0, (w - stageRect.width) / 2)
  const maxY = Math.max(0, (h - stageRect.height) / 2)
  return {
    x: Math.min(maxX, Math.max(-maxX, pos.x)),
    y: Math.min(maxY, Math.max(-maxY, pos.y)),
  }
}

function Lightbox({ image, onClose }) {
  const stageRef = useRef(null)
  const imgRef = useRef(null)
  const baseRectRef = useRef(null)
  const scaleRef = useRef(1)
  const posRef = useRef({ x: 0, y: 0 })
  const pointers = useRef(new Map())
  const pinchStart = useRef(null)
  const panStart = useRef(null)
  const downPoint = useRef(null)
  const downTarget = useRef(null)
  const draggedRef = useRef(false)
  const lastTap = useRef(null)
  const [, forceRender] = useState(0)

  function applyTransform() {
    const el = imgRef.current
    if (!el) return
    el.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px) scale(${scaleRef.current})`
    el.style.cursor = scaleRef.current > MIN_SCALE ? 'grab' : 'zoom-in'
    forceRender((n) => n + 1)
  }

  function setScaleAndPos(nextScale, nextPos) {
    const stageRect = stageRef.current?.getBoundingClientRect()
    const s = clampScale(nextScale)
    const p = clampPos(s, nextPos, baseRectRef.current, stageRect)
    scaleRef.current = s
    posRef.current = p
    applyTransform()
  }

  function zoomAt(clientX, clientY, nextScaleRaw) {
    const stageRect = stageRef.current?.getBoundingClientRect()
    if (!stageRect) return
    const cx = stageRect.left + stageRect.width / 2
    const cy = stageRect.top + stageRect.height / 2
    const ratio = clampScale(nextScaleRaw) / scaleRef.current
    const nx = posRef.current.x - (clientX - cx - posRef.current.x) * (ratio - 1)
    const ny = posRef.current.y - (clientY - cy - posRef.current.y) * (ratio - 1)
    setScaleAndPos(nextScaleRaw, { x: nx, y: ny })
  }

  useEffect(() => {
    scaleRef.current = 1
    posRef.current = { x: 0, y: 0 }
    baseRectRef.current = null
    pointers.current.clear()
    pinchStart.current = null
    panStart.current = null
    applyTransform()
  }, [image])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return undefined
    function onWheel(e) {
      e.preventDefault()
      const factor = Math.exp(-e.deltaY * 0.0015)
      zoomAt(e.clientX, e.clientY, scaleRef.current * factor)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function onImageLoad() {
    baseRectRef.current = imgRef.current?.getBoundingClientRect() || null
  }

  function onPointerDown(e) {
    downTarget.current = e.target
    stageRef.current?.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    downPoint.current = { x: e.clientX, y: e.clientY }
    draggedRef.current = false

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values())
      pinchStart.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        scale: scaleRef.current,
        pos: posRef.current,
        mid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
      }
      panStart.current = null
    } else if (pointers.current.size === 1 && scaleRef.current > MIN_SCALE) {
      panStart.current = { startX: e.clientX, startY: e.clientY, origin: posRef.current }
    }
  }

  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (downPoint.current) {
      const moved = Math.hypot(e.clientX - downPoint.current.x, e.clientY - downPoint.current.y)
      if (moved > DRAG_THRESHOLD) draggedRef.current = true
    }

    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = Array.from(pointers.current.values())
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const ratio = dist / pinchStart.current.dist
      const targetScale = pinchStart.current.scale * ratio
      const { mid } = pinchStart.current
      const stageRect = stageRef.current.getBoundingClientRect()
      const cx = stageRect.left + stageRect.width / 2
      const cy = stageRect.top + stageRect.height / 2
      const r = clampScale(targetScale) / pinchStart.current.scale
      const nx = pinchStart.current.pos.x - (mid.x - cx - pinchStart.current.pos.x) * (r - 1)
      const ny = pinchStart.current.pos.y - (mid.y - cy - pinchStart.current.pos.y) * (r - 1)
      setScaleAndPos(targetScale, { x: nx, y: ny })
    } else if (panStart.current && pointers.current.size === 1) {
      const dx = e.clientX - panStart.current.startX
      const dy = e.clientY - panStart.current.startY
      setScaleAndPos(scaleRef.current, { x: panStart.current.origin.x + dx, y: panStart.current.origin.y + dy })
    }
  }

  function onPointerUp(e) {
    const wasPinching = pointers.current.size >= 2
    const tappedOnImage = downTarget.current === imgRef.current
    const tappedOnStage = downTarget.current === stageRef.current
    const wasDragged = draggedRef.current

    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
    if (pointers.current.size === 0) {
      panStart.current = null
    } else if (pointers.current.size === 1 && scaleRef.current > MIN_SCALE) {
      const remaining = Array.from(pointers.current.values())[0]
      panStart.current = { startX: remaining.x, startY: remaining.y, origin: posRef.current }
    }

    if (wasPinching || wasDragged) return

    const now = Date.now()
    const prev = lastTap.current
    const isDoubleTap =
      prev &&
      now - prev.time < DOUBLE_TAP_MS &&
      Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < DOUBLE_TAP_DIST

    if (tappedOnImage) {
      if (isDoubleTap) {
        lastTap.current = null
        if (scaleRef.current > MIN_SCALE) {
          setScaleAndPos(1, { x: 0, y: 0 })
        } else {
          zoomAt(e.clientX, e.clientY, DOUBLE_TAP_SCALE)
        }
      } else {
        lastTap.current = { time: now, x: e.clientX, y: e.clientY }
      }
    } else if (tappedOnStage) {
      lastTap.current = null
      onClose()
    }
  }

  return createPortal(
    <div
      ref={stageRef}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onClose}
        className="absolute top-4 right-4 z-10 grid place-items-center w-9 h-9 rounded-lg text-white hover:bg-white/10 cursor-pointer"
        aria-label="Закрыть"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
      <img
        ref={imgRef}
        src={image.url}
        alt={image.fileName}
        draggable={false}
        onLoad={onImageLoad}
        className="max-w-[92vw] max-h-[92vh] object-contain select-none"
        style={{ transform: `translate(${posRef.current.x}px, ${posRef.current.y}px) scale(${scaleRef.current})`, touchAction: 'none' }}
      />
    </div>,
    document.body,
  )
}

export function AmbassadorDetailModal({ ambassador, onClose }) {
  const screenshotUrl = useKhochuPlachuStore((s) => s.screenshotUrl)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    let revoked = []
    setLightbox(null)
    if (!ambassador) {
      setImages([])
      return undefined
    }
    setLoading(true)
    Promise.all(
      ambassador.screenshots.map(async (shot) => {
        const res = await screenshotUrl(ambassador.id, shot.id)
        return res.ok ? { id: shot.id, fileName: shot.fileName, url: res.url } : null
      }),
    ).then((list) => {
      const ok = list.filter(Boolean)
      revoked = ok.map((i) => i.url)
      setImages(ok)
      setLoading(false)
    })
    return () => revoked.forEach((u) => URL.revokeObjectURL(u))
  }, [ambassador, screenshotUrl])

  if (!ambassador) return null
  const purged = ambassador.status === 'rejected'

  return (
    <Modal open={Boolean(ambassador)} onClose={() => { setLightbox(null); onClose() }} title="Карточка амбассадора" size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{purged ? 'Данные удалены после отклонения' : ambassador.theme}</p>
            <p className="caption">{ambassador.manager?.name}</p>
          </div>
          <Badge tone={STATUS_TONE[ambassador.status]}>{STATUS_LABEL[ambassador.status]}</Badge>
        </div>

        {!purged && (
          <>
            <div>
              <p className="caption mb-1">Условия</p>
              <p className="text-sm text-ink-2 leading-relaxed">{ambassador.conditions}</p>
            </div>

            {ambassador.managerComment && (
              <div>
                <p className="caption mb-1">Комментарий менеджера</p>
                <p className="text-sm text-ink-3 leading-relaxed">{ambassador.managerComment}</p>
              </div>
            )}

            <div>
              <p className="caption mb-1">Соцсети и ресурсы</p>
              <div className="flex flex-wrap gap-2">
                {ambassador.links.map((l) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">
                    {l.label}: {l.url}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-ink-3">
              <span>Контакт: {ambassador.contactUsername}</span>
              <a href={ambassador.telegramGroupLink} target="_blank" rel="noreferrer" className="text-accent hover:underline">Общий чат</a>
              {ambassador.callAt && <span>Звонок: {new Date(ambassador.callAt).toLocaleString('ru-RU')}</span>}
            </div>
          </>
        )}

        {ambassador.decidedBy && (
          <p className="caption">
            Решение: {ambassador.decidedBy.name}{ambassador.decidedAt ? `, ${new Date(ambassador.decidedAt).toLocaleString('ru-RU')}` : ''}
          </p>
        )}

        <div>
          <p className="caption mb-1">Скриншоты переписки</p>
          {purged ? (
            <p className="text-sm text-ink-3">Удалены вместе с остальными данными отклонённой заявки.</p>
          ) : loading ? (
            <div className="py-6 grid place-items-center"><Spinner /></div>
          ) : images.length === 0 ? (
            <p className="text-sm text-ink-3">Скриншоты не прикреплены.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {images.map((img) => (
                <button key={img.id} type="button" onClick={() => setLightbox(img)} className="block rounded-lg overflow-hidden border border-line cursor-pointer">
                  <img src={img.url} alt={img.fileName} className="w-full h-32 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox && <Lightbox key={lightbox.id} image={lightbox} onClose={() => setLightbox(null)} />}
    </Modal>
  )
}
