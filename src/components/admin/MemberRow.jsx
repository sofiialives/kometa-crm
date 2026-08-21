import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Avatar, Badge } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { displayName, roleBadge, userStatus } from '../../utils/admin'

export function MemberRow({ user, isLead = false, canPromote = true, onPromote, onMove, onDismiss }) {
  const role = roleBadge(user.role)
  const status = userStatus(user)

  return (
    <div
      title={status.label}
      className={cx(
        'spine flex items-center gap-3 rounded-lg py-2.5 pr-3 transition-colors',
        'spine--' + (status.tone === 'ok' ? 'ok' : status.tone === 'warn' ? 'warn' : 'danger'),
        isLead ? 'bg-panel-2' : 'hover:bg-panel-2',
      )}
    >
      <Avatar name={displayName(user)} src={user.avatarUrl} color={user.avatarColor} size={isLead ? 36 : 30} ring={isLead} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{displayName(user)}</p>
        {user.position && <p className="caption truncate">{user.position}</p>}
      </div>

      <Badge tone={role.tone}>{role.label}</Badge>

      <RowMenu
        canPromote={canPromote && !isLead && user.role !== 'admin'}
        onPromote={() => onPromote?.(user)}
        onMove={() => onMove?.(user)}
        onDismiss={() => onDismiss?.(user)}
      />
    </div>
  )
}

function RowMenu({ canPromote, onPromote, onMove, onDismiss }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  function place() {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    // Меню шириной 224px, прижимаем к правому краю кнопки; если не влезает
    // снизу — открываем вверх, а не обрезаем об низ экрана.
    const menuH = 132
    const openUp = r.bottom + menuH + 8 > window.innerHeight
    setPos({
      left: Math.min(r.right - 224, window.innerWidth - 232),
      top: openUp ? r.top - menuH - 6 : r.bottom + 6,
    })
  }

  function toggle() {
    if (!open) place()
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    place()
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  function pick(action) {
    setOpen(false)
    action()
  }

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label="Действия"
        aria-expanded={open}
        className="grid h-7 w-7 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ background: 'var(--color-panel)', position: 'fixed', top: pos.top, left: pos.left }}
          className="z-[200] w-56 overflow-hidden rounded-xl panel py-1 animate-fade-in"
        >
          {canPromote && <MenuItem onClick={() => pick(onPromote)}>Повысить до главного</MenuItem>}
          <MenuItem onClick={() => pick(onMove)}>Отдел и должность</MenuItem>
          <div className="my-1 h-px bg-panel-2" />
          <MenuItem danger onClick={() => pick(onDismiss)}>Уволить</MenuItem>
        </div>,
        document.body,
      )}
    </div>
  )
}

function MenuItem({ danger, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'block w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer',
        danger ? 'text-danger hover:bg-danger/10' : 'text-ink-2 hover:bg-panel-2 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
