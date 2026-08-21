import { Avatar, Badge, Button, Modal } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { COLUMNS, formatMskDate, formatMskTime } from '../../utils/tasks'

export function TaskDetailModal({ task, onClose, isMine, onMove }) {
  if (!task) return null
  const col = COLUMNS.find((c) => c.key === task.status)
  const isDone = task.status === 'done'
  const dateLabel = formatMskDate(task.deadline)
  const timeLabel = formatMskTime(task.deadline)

  return (
    <Modal open={Boolean(task)} onClose={onClose} title="Задача" size="md">
      <div className="flex flex-col gap-5">
        <div>
          <h3 className={cx('text-lg font-semibold leading-snug', isDone && 'line-through text-ink-3')}>
            {task.title}
          </h3>
          {task.description && (
            <p className={cx('text-sm text-ink-2 leading-relaxed mt-2 whitespace-pre-wrap', isDone && 'line-through')}>
              {task.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar name={task.owner?.name || '?'} src={task.owner?.avatarUrl} color={task.owner?.avatarColor} size={26} />
            <span className="text-sm text-ink-2">{task.owner?.name || 'Без имени'}</span>
          </div>
          <span className="caption">{dateLabel} · {timeLabel} МСК</span>
          {isDone ? (
            <Badge tone="neutral">Готово</Badge>
          ) : task.overdue ? (
            <Badge tone="danger">Срок прошёл</Badge>
          ) : (
            <Badge tone="brand">В работе</Badge>
          )}
        </div>

        {isMine && col && (col.prev || col.next) && (
          <div className="flex items-center gap-3 pt-1">
            {col.prev && (
              <Button variant="ghost" onClick={() => { onMove(task.id, col.prev); onClose() }}>← Назад</Button>
            )}
            {col.next && (
              <Button onClick={() => { onMove(task.id, col.next); onClose() }}>→ {col.nextLabel}</Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
