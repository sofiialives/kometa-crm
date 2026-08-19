import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '../../core/store/authStore'
import { useUiStore } from '../../core/store/uiStore'
import { Avatar } from '../ui/Avatar'
import { ConfirmModal } from '../ui/Modal'
import { cx } from '../lib/cx'
import { roleLabel } from './Header'

function useNavItems() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  return [
    ...(isAdmin ? [{ to: '/admin', label: 'Админ-панель', icon: IconShield }] : []),
    { to: '/', label: 'Иерархия', icon: IconTree },
    { to: '/tasks', label: 'Задачи', icon: IconBoard },
  ]
}

function NavList({ onNavigate }) {
  const items = useNavItems()
  return (
    <nav className="flex flex-col gap-1">
      <p className="mono-caption px-3.5 pb-2">Навигация</p>
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-gradient-to-r from-brand-blue/25 to-brand-purple/12 text-ink border border-brand-purple/35 shadow-[0_0_24px_rgba(133,76,255,0.15)]'
                : 'text-ink-3 border border-transparent hover:text-ink hover:bg-white/5',
            )
          }
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function UserCard() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [confirmOut, setConfirmOut] = useState(false)
  if (!user) return null
  return (
    <>
      <div className="glass rounded-2xl p-3 flex items-center gap-3">
        <Avatar name={user.name} size={36} />
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="mono-caption">{roleLabel(user.role)}</p>
        </div>
        <button
          onClick={() => setConfirmOut(true)}
          className="grid place-items-center w-8 h-8 rounded-lg text-ink-3 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
          title="Выйти"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
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
    </>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0">
      <div className="glass rounded-card p-3 flex flex-col gap-4 sticky top-[88px] w-full h-[calc(100vh-120px)]">
        <NavList />
        <div className="mt-auto flex flex-col gap-3">
          <div className="h-px bg-white/8" />
          <UserCard />
        </div>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const open = useUiStore((s) => s.navOpen)
  const closeNav = useUiStore((s) => s.closeNav)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden animate-fade-in" onMouseDown={(e) => e.target === e.currentTarget && closeNav()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onMouseDown={closeNav} />
      <div className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-space-2/95 glass border-l border-white/10 p-4 flex flex-col gap-4 animate-modal-in">
        <div className="flex items-center justify-between">
          <img src="/kometa.png" alt="KOMETA" className="h-6 w-auto" />
          <button onClick={closeNav} className="grid place-items-center w-9 h-9 rounded-lg text-ink-3 hover:text-ink hover:bg-white/5 cursor-pointer" aria-label="Закрыть меню">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <NavList onNavigate={closeNav} />
        <div className="mt-auto flex flex-col gap-3">
          <div className="h-px bg-white/8" />
          <UserCard />
        </div>
      </div>
    </div>,
    document.body,
  )
}

const ic = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
function IconTree() {
  return (<svg {...ic}><rect x="9" y="2" width="6" height="5" rx="1.5"/><rect x="2" y="17" width="6" height="5" rx="1.5"/><rect x="16" y="17" width="6" height="5" rx="1.5"/><path d="M12 7v4M5 17v-3h14v3M12 11v3"/></svg>)
}
function IconBoard() {
  return (<svg {...ic}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M15 3v18"/></svg>)
}
function IconShield() {
  return (<svg {...ic}><path d="M12 2l8 3v6c0 5-3.5 9.4-8 11-4.5-1.6-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></svg>)
}
