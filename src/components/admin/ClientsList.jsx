import { Card, Badge, Button } from '../../shared/ui'
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

export function ClientsList({ clients, statsByClient, onAdd, onEdit, onDelete }) {
  return (
    <Card pad="none" className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-3">
            <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span className="font-medium">Клиенты</span>
          <Badge tone="neutral">{clients.length}</Badge>
        </div>
        <Button size="sm" variant="secondary" onClick={onAdd}>+ Клиент</Button>
      </div>

      {clients.length === 0 ? (
        <p className="px-5 py-4 text-sm text-ink-3">
          Клиентов пока нет — добавьте первого, чтобы в Иерархии было из чего выбирать при создании работы.
        </p>
      ) : (
        <div className="divide-y divide-line">
          {clients.map((c) => {
            const stats = statsByClient?.[c.id] || { worksCount: 0, tasksCount: 0 }
            return (
              <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="caption">{workCount(stats.worksCount)} · {taskCount(stats.tasksCount)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => onEdit(c)}
                    aria-label={`Переименовать клиента ${c.name}`}
                    title="Переименовать"
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink cursor-pointer"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(c)}
                    aria-label={`Удалить клиента ${c.name}`}
                    title="Удалить клиента и все его работы"
                    className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-danger-soft hover:text-danger cursor-pointer"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
