import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '../../core/store/authStore'
import { useUiStore } from '../../core/store/uiStore'
import { useDepartmentsStore } from '../../core/store/departmentsStore'
import { useKhochuPlachuStore } from '../../core/store/khochuPlachuStore'
import { Avatar } from '../ui/Avatar'
import { ConfirmModal } from '../ui/Modal'
import { cx } from '../lib/cx'
import { roleLabel } from './Header'

function useNavItems() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const departments = useDepartmentsStore((s) => s.departments)
  const fetchDepartments = useDepartmentsStore((s) => s.fetchDepartments)
  const unreadCount = useKhochuPlachuStore((s) => s.unreadCount)
  const fetchUnreadCount = useKhochuPlachuStore((s) => s.fetchUnreadCount)

  useEffect(() => {
    if (departments.length === 0) fetchDepartments()
  }, [departments.length, fetchDepartments])

  const department = departments.find((d) => d.id === user?.departmentId)
  const isKhochuPlachuDept = department?.name === 'Хочу Плачу фокус'
  const isAccountManager = isKhochuPlachuDept && user?.position === 'Аккаунт менеджер'
  const canSeeKhochuPlachu = isAdmin || (isKhochuPlachuDept && ['Менеджер', 'Аккаунт менеджер'].includes(user?.position))

  useEffect(() => {
    if (isAccountManager) fetchUnreadCount()
  }, [isAccountManager, fetchUnreadCount])

  return [
    ...(isAdmin ? [{ to: '/admin', label: 'Админ-панель', icon: IconShield }] : []),
    ...(isAdmin ? [{ to: '/board', label: 'Клиенты', icon: IconBoardMoney }] : []),
    { to: '/', label: 'Иерархия', icon: IconTree },
    // У админа нет своего отдела, поэтому «Задачи» для него — это только
    // его личные задачи, не работа с чужими. Называем это явно, иначе
    // легко перепутать с управлением отделами в Иерархии.
    { to: '/tasks', label: 'Задачи', icon: IconBoard },
    { to: '/calls', label: 'Звонки', icon: IconPhone },
    { to: '/archive', label: 'Архив', icon: IconArchive },
    { to: '/motivation', label: 'Мотивация', icon: IconTrophy },
    ...(canSeeKhochuPlachu ? [{ to: '/khochu-plachu', label: 'Хочу Плачу!', icon: IconPaw, badge: isAccountManager ? unreadCount : 0 }] : []),
  ]
}

function IconBoardMoney() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M8 15h3" />
    </svg>
  )
}

function IconArchive() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
    </svg>
  )
}

function NavList({ onNavigate }) {
  const items = useNavItems()
  return (
    <nav className="flex flex-col gap-1">
      <p className="caption px-3.5 pb-2">Навигация</p>
      {items.map(({ to, label, icon: Icon, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
              isActive
                ? 'bg-gradient-to-r from-accent/25 to-accent/12 text-ink border border-accent/35'
                : 'text-ink-3 border border-transparent hover:text-ink hover:bg-panel-2',
            )
          }
        >
          <Icon />
          <span className="flex-1">{label}</span>
          {Boolean(badge) && (
            <span className="rounded-full bg-accent-soft px-1.5 text-xs tabular-nums text-accent">{badge}</span>
          )}
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
      <div className="panel rounded-2xl p-3 flex items-center gap-3">
        <Link to="/settings" title="Настройки профиля" className="shrink-0">
          <Avatar name={user.name} email={user.email} src={user.avatarUrl} color={user.avatarColor} size={36} />
        </Link>
        <Link to="/settings" className="flex-1 min-w-0 leading-tight">
          <p className="text-sm font-medium truncate hover:text-accent transition-colors">{user.name}</p>
          <p className="caption">{roleLabel(user.role)}</p>
        </Link>
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
    <aside className="hidden md:flex w-60 shrink-0 sticky top-16 h-[calc(100vh-64px)] border-r border-line bg-panel/50 ">
      <div className="flex flex-col gap-4 w-full p-3">
        <NavList />
        <div className="mt-auto flex flex-col gap-3">
          <div className="h-px bg-panel-2" />
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
      <div className="absolute inset-0 bg-black/60 " onMouseDown={closeNav} />
      <div className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-panel/95 panel border-l border-line p-4 flex flex-col gap-4 animate-modal-in">
        <div className="flex items-center justify-between">
          <img src="/kometa.png" alt="KOMETA" className="logo-mark h-6 w-auto" />
          <button onClick={closeNav} className="grid place-items-center w-9 h-9 rounded-lg text-ink-3 hover:text-ink hover:bg-panel-2 cursor-pointer" aria-label="Закрыть меню">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <NavList onNavigate={closeNav} />
        <div className="mt-auto flex flex-col gap-3">
          <div className="h-px bg-panel-2" />
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
function IconPhone() {
  return (<svg {...ic}><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M9.5 14.2c.6 1.3 1.6 2.3 2.9 2.9l.9-.9c.2-.2.5-.3.8-.2l1.6.5c.3.1.5.4.5.7v1.3c0 .4-.4.8-.8.7-3.4-.3-6.1-3-6.4-6.4 0-.4.3-.8.7-.8h1.3c.3 0 .6.2.7.5l.5 1.6c.1.3 0 .6-.2.8z"/></svg>)
}
function IconTrophy() {
  return (<svg {...ic}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>)
}
function IconShield() {
  return (<svg {...ic}><path d="M12 2l8 3v6c0 5-3.5 9.4-8 11-4.5-1.6-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></svg>)
}
function IconPaw() {
  return (
    <svg width={16} height={16} viewBox="0 0 156 152" fill="currentColor">
      <path d="M59.916 0.00880488C69.2704 0.532275 76.896 12.4118 76.9041 26.6835C76.9278 40.8782 69.466 52.0402 60.0961 51.5938C50.8032 51.1629 43.1006 39.2678 43.0154 24.9805C42.9147 10.7703 50.5306 -0.360593 59.916 0.00880488ZM114.997 11.1161C123.869 14.4284 126.499 27.6254 121.053 40.7171C115.361 53.8393 103.727 61.8352 94.9165 58.6154C86.0288 55.3801 83.4759 42.1986 89.0759 29.138C94.6144 15.9848 106.248 7.98891 114.997 11.1161ZM11.5556 27.1345C21.099 25.1307 31.657 34.3948 35.4891 47.5937C38.8894 60.9461 34.3077 73.3302 24.8414 75.3496C15.3751 77.369 4.87853 68.1974 1.2316 54.8755C-2.41533 41.5535 2.33597 29.1234 11.5556 27.1345ZM150.221 55.0969C157.949 60.5034 157.512 73.8035 148.987 84.6709C140.463 95.5384 127.232 99.9253 119.288 94.3951C111.344 88.8649 111.92 75.6729 120.229 64.6818C128.877 53.9995 142.2 49.5511 150.221 55.0969ZM120.61 135.548C119.458 142.851 112.295 149.745 105.064 151.413C90.001 154.949 82.6744 111.656 67.3442 108.565C52.0139 105.473 26.4143 142.688 14.2385 133.098C7.29604 127.769 4.00004 116.683 6.67925 108.565C10.3806 97.3661 25.4129 93.9839 35.272 87.2336C48.3245 78.5618 60.1448 59.7007 75.6291 62.8231C91.0364 65.93 95.1477 87.6832 103.295 100.951C109.951 112.073 122.603 122.882 120.61 135.548Z" />
    </svg>
  )
}
