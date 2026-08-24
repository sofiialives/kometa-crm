import { Avatar, Badge, Spinner } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { taskBadge } from '../../utils/hierarchy'
import { priorityMeta } from '../../utils/tasks'

const PRIORITY_DOT = { neutral: 'bg-ink-3', warn: 'bg-warn', danger: 'bg-danger' }

export function TaskLine({ task, canToggle, busy, onToggle, onOpen }) {
  const badge = taskBadge(task)
  const priority = priorityMeta(task.priority)
  const done = task.status === 'done'

  return (
    <div className="flex items-center gap-3 py-2">
      <button
        onClick={() => canToggle && !busy && onToggle(task)}
        disabled={!canToggle || busy}
        aria-label={done ? 'Вернуть в работу' : 'Отметить выполненной'}
        title={canToggle ? undefined : 'Отмечать можно только свои задачи'}
        className={cx(
          'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors duration-150',
          done ? 'border-transparent bg-accent' : 'border-line-2 bg-panel-2',
          canToggle ? 'cursor-pointer hover:border-accent/60' : 'cursor-not-allowed opacity-60',
        )}
      >
        {busy ? (
          <Spinner size={10} />
        ) : (
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round"
            className={cx('transition-opacity duration-150', done ? 'opacity-100' : 'opacity-0')}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <button
        onClick={() => onOpen(task)}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer"
      >
        <Avatar name={task.owner?.name} src={task.owner?.avatarUrl} color={task.owner?.avatarColor} size={22} title={task.owner?.name} />
        <span
          className={cx('h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[priority.tone])}
          title={`Приоритет: ${priority.label}`}
        />
        <p className={cx('min-w-0 flex-1 truncate text-sm', done ? 'text-ink-3 line-through' : 'text-ink-2')}>
          {task.title}
        </p>
      </button>

      <Badge tone={badge.tone} className="shrink-0">{badge.label}</Badge>
    </div>
  )
}
