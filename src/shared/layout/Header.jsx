import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../core/store/authStore'
import { useUiStore } from '../../core/store/uiStore'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { ConfirmModal } from '../ui/Modal'
import { ThemeToggle } from '../ui/ThemeToggle'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const toggleNav = useUiStore((s) => s.toggleNav)
  const navigate = useNavigate()
  const [confirmOut, setConfirmOut] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-space/85 backdrop-blur-xl">
      <div className="mx-auto max-w-[1360px] px-5 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/kometa.png" alt="KOMETA" className="logo-mark h-7 w-auto select-none" draggable="false" />
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/settings" className="flex flex-col items-end leading-tight" title="Настройки профиля">
                <span className="text-sm font-medium hover:text-brand-light transition-colors">{user.name}</span>
                <span className="mono-caption">{roleLabel(user.role)}</span>
              </Link>
              <Link to="/settings" title="Настройки профиля">
                <Avatar name={user.name} src={user.avatarUrl} color={user.avatarColor} size={34} />
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setConfirmOut(true)}>
                Выйти
              </Button>
            </div>
          )}
          <button
            onClick={toggleNav}
            className="md:hidden grid place-items-center w-10 h-10 -mr-2 rounded-xl text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
            aria-label="Меню"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOut}
        onClose={() => setConfirmOut(false)}
        onConfirm={() => {
          setConfirmOut(false)
          logout()
          navigate('/login')
        }}
        title="Выйти из панели?"
        text="Текущая сессия завершится, для возврата понадобится войти заново."
        confirmText="Выйти"
        danger
      />
    </header>
  )
}

export function roleLabel(role) {
  return { admin: 'Админ', lead: 'Главный отдела', staff: 'Сотрудник' }[role] || role
}
