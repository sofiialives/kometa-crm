import { Avatar, Badge, Button, Modal } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { taskBadge } from '../../utils/hierarchy'
import { formatMskDate, formatMskTime, priorityMeta } from '../../utils/tasks'

export function TaskDetailModal({ task, onClose, canManage, canToggle, busy, onToggle, onEdit, onExtend, onDelete }) {
  if (!task) return null

  const badge = taskBadge(task)
  const priority = priorityMeta(task.priority)
  const done = task.status === 'done'

  return (
    <Modal open={Boolean(task)} onClose={onClose} title="Задача" size="md">
      <div className="flex flex-col gap-5">
        <div>
          <h3 className={cx('text-lg font-semibold leading-snug', done && 'line-through text-ink-3')}>
            {task.title}
          </h3>
          {task.description && (
            <p className={cx('mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-2', done && 'line-through')}>
              {task.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Avatar name={task.owner?.name} src={task.owner?.avatarUrl} color={task.owner?.avatarColor} size={26} />
            <span className="text-sm text-ink-2">{task.owner?.name || 'Без имени'}</span>
          </div>
          <span className="caption">{formatMskDate(task.deadline)} · {formatMskTime(task.deadline)} МСК</span>
          <Badge tone={priority.tone}>{priority.label}</Badge>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {canToggle && (
            <Button loading={busy} onClick={() => onToggle(task)}>
              {done ? '← Вернуть в работу' : 'Отметить выполненной'}
            </Button>
          )}
          {canManage && (
            <>
              <Button variant="ghost" onClick={() => onEdit(task)}>Изменить</Button>
              <Button variant="ghost" onClick={() => onExtend(task)}>Продлить срок</Button>
              <Button variant="ghost" className="text-danger hover:text-danger" onClick={() => onDelete(task)}>
                Удалить
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
