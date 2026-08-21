import { Badge, Spinner } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { taskBadge } from '../../utils/hierarchy'
import { formatMskDate } from '../../utils/tasks'

export function TaskLine({ task, canToggle, busy, onToggle }) {
  const badge = taskBadge(task)
  const done = task.status === 'done'

  return (
    <div className="flex items-center gap-3 py-2">
      <button
        onClick={() => canToggle && !busy && onToggle(task)}
        disabled={!canToggle || busy}
        aria-label={done ? 'Вернуть в работу' : 'Отметить выполненной'}
        title={canToggle ? undefined : 'Отмечать можно только свои задачи'}
        className={cx(
          'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all duration-150',
          done
            ? 'border-transparent bg-gradient-to-br from-brand-blue to-brand-purple'
            : 'border-white/25 bg-white/[0.04]',
          canToggle ? 'cursor-pointer hover:border-brand-purple/60' : 'cursor-not-allowed opacity-60',
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

      <div className="min-w-0 flex-1">
        <p className={cx('truncate text-sm', done ? 'text-ink-3 line-through' : 'text-ink-2')}>
          {task.title}
        </p>
        {task.description && (
          <p className="truncate text-[12.5px] text-ink-3" title={task.description}>
            {task.description}
          </p>
        )}
      </div>

      <span className="mono-caption shrink-0">{formatMskDate(task.deadline)}</span>
      <Badge tone={badge.tone} dot={false} className="shrink-0">{badge.label}</Badge>
    </div>
  )
}
