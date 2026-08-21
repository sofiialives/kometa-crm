import { useEffect, useRef, useState } from 'react'
import { Avatar, Badge } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { displayName, roleBadge, userStatus } from '../../utils/admin'

export function MemberRow({ user, isLead = false, canPromote = true, onPromote, onMove, onDismiss }) {
  const role = roleBadge(user.role)
  const status = userStatus(user)

  return (
    <div
      className={cx(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
        isLead ? 'glass border border-brand-purple/35' : 'hover:bg-white/[0.03]',
      )}
    >
      <Avatar name={displayName(user)} src={user.avatarUrl} size={isLead ? 36 : 30} ring={isLead} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{displayName(user)}</p>
        {user.position && <p className="mono-caption truncate">{user.position}</p>}
      </div>

      <Badge tone={role.tone} dot={false}>{role.label}</Badge>

      <span
        title={status.label}
        className={cx(
          'h-2 w-2 shrink-0 rounded-full',
          status.tone === 'ok' && 'bg-ok',
          status.tone === 'warn' && 'bg-warn',
          status.tone === 'danger' && 'bg-danger',
        )}
      />

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
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(action) {
    setOpen(false)
    action()
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Действия"
        aria-expanded={open}
        className="grid h-7 w-7 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-white/5 hover:text-ink cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>

      {open && (
        // .glass перебивает фоновую утилиту Tailwind, поэтому фон — инлайном
        <div
          style={{ background: 'var(--color-space-2)' }}
          className="absolute right-0 top-9 z-30 w-56 overflow-hidden rounded-xl glass py-1 shadow-[0_20px_50px_rgba(0,0,0,0.55)] animate-fade-in"
        >
          {canPromote && <MenuItem onClick={() => pick(onPromote)}>Повысить до главного</MenuItem>}
          <MenuItem onClick={() => pick(onMove)}>Отдел и должность</MenuItem>
          <div className="my-1 h-px bg-white/8" />
          <MenuItem danger onClick={() => pick(onDismiss)}>Уволить</MenuItem>
        </div>
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
        danger ? 'text-danger hover:bg-danger/10' : 'text-ink-2 hover:bg-white/5 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
