import { Avatar, Badge, Button } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { formatMskDate, formatMskTime, isTodayMsk, priorityMeta } from '../../utils/tasks'

export function TaskCard({ task, col, isMine, onMove, onOpen }) {
  const time = formatMskTime(task.deadline)
  const dateLabel = isTodayMsk(task.deadline) ? null : formatMskDate(task.deadline)
  const isDone = task.status === 'done'
  const priority = priorityMeta(task.priority)

  return (
    <div
      onClick={() => onOpen(task)}
      className={cx(
        'panel rounded-2xl p-3.5 flex flex-col gap-2.5 transition-colors cursor-pointer',
        isDone ? 'opacity-80' : 'hover:border-accent/35',
      )}
    >
      <div>
        <p className={cx('text-sm leading-snug', isDone && 'line-through text-ink-3')}>{task.title}</p>
        {task.description && (
          <p className={cx('text-xs text-ink-3 leading-relaxed mt-1 line-clamp-2', isDone && 'line-through')}>
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={task.owner?.name} src={task.owner?.avatarUrl} color={task.owner?.avatarColor} size={22} />
          <span className="caption truncate">
            {dateLabel && <span className="text-accent">{dateLabel} · </span>}
            {time}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge tone={priority.tone}>{priority.label}</Badge>
          {isDone ? (
            <Badge tone="neutral">Готово</Badge>
          ) : task.overdue ? (
            <Badge tone="danger">Срок прошёл</Badge>
          ) : (
            <Badge tone="brand">В работе</Badge>
          )}
        </div>
      </div>

      {isMine && (col.prev || col.next) && (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {col.prev && (
            <Button size="sm" variant="ghost" onClick={() => onMove(task.id, col.prev)}>←</Button>
          )}
          {col.next && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onMove(task.id, col.next)}>
              → {col.nextLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
