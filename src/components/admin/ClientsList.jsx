import { Card, Badge } from '../../shared/ui'
import { taskCount } from '../../utils/hierarchy'

/** «Работа» по-русски склоняется иначе, чем «задача» — отдельная функция,
 * а не переиспользование taskCount с другим словом. */
function workCount(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} работа`
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${n} работы`
  return `${n} работ`
}

export function ClientsList({ clients, onDelete }) {
  if (clients.length === 0) {
    return (
      <Card pad="md">
        <p className="text-sm text-ink-3">Клиентов пока нет — они появляются сами, когда в Иерархии заводят первую работу.</p>
      </Card>
    )
  }

  return (
    <Card pad="none" className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-3">
            <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span className="font-medium">Клиенты</span>
        </div>
        <Badge tone="neutral">{clients.length}</Badge>
      </div>

      <div className="divide-y divide-line">
        {clients.map((c) => (
          <div key={c.name} className="flex items-center justify-between gap-3 px-5 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="caption">{workCount(c.worksCount)} · {taskCount(c.tasksCount)}</p>
            </div>
            <button
              onClick={() => onDelete(c)}
              aria-label={`Удалить клиента ${c.name}`}
              title="Удалить клиента и все его работы"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}
