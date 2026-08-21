import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../lib/cx'
import { Button } from './Button'

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Modal({ open, onClose, title, size = 'md', closeOnOverlay = true, hideClose = false, footer, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && !hideClose && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, hideClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 animate-fade-in"
      onMouseDown={(e) => closeOnOverlay && !hideClose && e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cx(
          'flex w-full max-h-[calc(100dvh-2rem)] flex-col panel rounded-card bg-panel/90',
          'animate-modal-in',
          sizes[size],
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-line">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
          {!hideClose && (
            <button
              onClick={onClose}
              className="grid place-items-center w-8 h-8 rounded-lg text-ink-3 hover:text-ink hover:bg-panel-2 transition-colors cursor-pointer"
              aria-label="Закрыть"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-3 px-6 pb-5 pt-1">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmModal({ open, onClose, onConfirm, title = 'Вы уверены?', text, confirmText = 'Подтвердить', danger = false, loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmText}</Button>
        </>
      }
    >
      {text && <p className="text-sm text-ink-2 leading-relaxed">{text}</p>}
    </Modal>
  )
}
