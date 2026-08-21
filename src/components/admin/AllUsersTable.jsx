import { Card, Avatar, Badge, Button, EmptyState } from '../../shared/ui'
import { displayName, roleBadge, userStatus } from '../../utils/admin'

export function AllUsersTable({ users, departments, currentUserId, onDismiss }) {
  const deptName = (id) => departments.find((d) => d.id === id)?.name || '—'

  return (
    <Card pad="none" className="overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-line px-6 py-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-ink-3">
          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1" strokeLinecap="round" />
        </svg>
        <h2 className="text-[15px] font-semibold tracking-tight">Все сотрудники</h2>
      </div>

      {users.length === 0 ? (
        <div className="px-6">
          <EmptyState label="Пусто" text="Пока никого не пригласили." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-line">
                <Th>Сотрудник</Th>
                <Th>Отдел</Th>
                <Th>Роль</Th>
                <Th>Статус</Th>
                <Th className="text-right">Действия</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const role = roleBadge(u.role)
                const status = userStatus(u)
                return (
                  <tr key={u.id} className="border-b border-line last:border-0 transition-colors hover:bg-surface-3">
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={displayName(u)} src={u.avatarUrl} color={u.avatarColor} size={30} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium leading-tight">{displayName(u)}</p>
                          <p className="mono-caption truncate">{u.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-sm text-ink-2">{deptName(u.departmentId)}</Td>
                    <Td><Badge tone={role.tone} dot={false}>{role.label}</Badge></Td>
                    <Td><Badge tone={status.tone}>{status.label}</Badge></Td>
                    <Td className="text-right">
                      {!u.active ? (
                        <span className="mono-caption">уволен</span>
                      ) : u.id === currentUserId ? (
                        <span className="mono-caption">это вы</span>
                      ) : (
                        <Button size="sm" variant="danger" onClick={() => onDismiss(u)}>Уволить</Button>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function Th({ className = '', children }) {
  return <th className={`px-6 py-3 text-left mono-caption font-normal ${className}`}>{children}</th>
}

function Td({ className = '', children }) {
  return <td className={`px-6 py-3.5 align-middle ${className}`}>{children}</td>
}
