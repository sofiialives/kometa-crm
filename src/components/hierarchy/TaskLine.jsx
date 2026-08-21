import { Avatar, Badge, Spinner } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { taskBadge } from '../../utils/hierarchy'
import { formatMskDate, formatMskTime } from '../../utils/tasks'

export function TaskLine({ task, canToggle, canManage, busy, onToggle, onEdit, onExtend, onDelete }) {
  const badge = taskBadge(task)
  const done = task.status === 'done'

  return (
    <div className="group flex items-center gap-3 py-2">
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

      <Avatar name={task.owner?.name || '?'} src={task.owner?.avatarUrl} color={task.owner?.avatarColor} size={22} title={task.owner?.name} />

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

      <span className="mono-caption shrink-0">{formatMskDate(task.deadline)} · {formatMskTime(task.deadline)}</span>
      <Badge tone={badge.tone} dot={false} className="shrink-0">{badge.label}</Badge>

      {canManage && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <IconButton label="Изменить" onClick={() => onEdit(task)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </IconButton>
          <IconButton label="Продлить срок" onClick={() => onExtend(task)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
          </IconButton>
          <IconButton label="Удалить задачу" danger onClick={() => onDelete(task)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
            </svg>
          </IconButton>
        </div>
      )}
    </div>
  )
}

function IconButton({ label, danger, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cx(
        'grid h-6 w-6 place-items-center rounded-md transition-colors cursor-pointer',
        danger ? 'text-ink-3 hover:bg-danger/10 hover:text-danger' : 'text-ink-3 hover:bg-white/5 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
