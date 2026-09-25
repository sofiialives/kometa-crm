import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { AppLayout } from '../../shared/layout/AppLayout'
import LoginPage from '../../pages/Login'
import HierarchyPage from '../../pages/Hierarchy'
import TasksPage from '../../pages/Tasks'
import CallsPage from '../../pages/Calls'
import ArchivePage from '../../pages/Archive'
import BoardPage from '../../pages/Board'
import AdminPage from '../../pages/Admin'
import SettingsPage from '../../pages/Settings'

function Protected() {
  const isAuthed = useAuthStore((s) => Boolean(s.token))
  const location = useLocation()
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

function AdminOnly() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <Protected />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HierarchyPage /> },
          { path: '/tasks', element: <TasksPage /> },
          { path: '/calls', element: <CallsPage /> },
          { path: '/archive', element: <ArchivePage /> },
          { path: '/settings', element: <SettingsPage /> },
          {
            element: <AdminOnly />,
            children: [
              { path: '/admin', element: <AdminPage /> },
              // Доска клиентов — финансы агентства. Заказчик на вопрос,
              // кто её видит, ответил одним словом: «только я».
              { path: '/board', element: <BoardPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
