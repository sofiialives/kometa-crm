import { Avatar, Badge, Button, Modal } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { COLUMNS, formatMskDate, taskTimes } from '../../utils/tasks'

export function TaskDetailModal({ task, onClose, isMine, isAdminDiary, onMove, onEdit, onExtend, onDelete }) {
  if (!task) return null
  const col = COLUMNS.find((c) => c.key === task.status)
  const isDone = task.status === 'done'
  const { text: times, crossDay } = taskTimes(task)

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
            <Avatar name={task.owner?.name} src={task.owner?.avatarUrl} color={task.owner?.avatarColor} size={26} />
            <span className="text-sm text-ink-2">{task.owner?.name || 'Без имени'}</span>
          </div>
          <span className="caption">{crossDay ? times : `${formatMskDate(task.deadline)} · ${times}`} МСК</span>
          {isDone ? (
            <Badge tone="neutral">Готово</Badge>
          ) : task.overdue ? (
            <Badge tone="danger">Срок прошёл</Badge>
          ) : (
            <Badge tone="brand">В работе</Badge>
          )}
        </div>

        {isMine && (!task.overdue || isAdminDiary) && col && (col.prev || col.next) && (
          <div className="flex items-center gap-3 pt-1">
            {col.prev && (
              <Button variant="ghost" onClick={() => { onMove(task.id, col.prev); onClose() }}>← Назад</Button>
            )}
            {col.next && (
              <Button onClick={() => { onMove(task.id, col.next); onClose() }}>→ {col.nextLabel}</Button>
            )}
          </div>
        )}

        {isAdminDiary && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => { onEdit(task); onClose() }}>Изменить</Button>
            <Button variant="ghost" onClick={() => { onExtend(task); onClose() }}>Перенести срок</Button>
            <Button variant="ghost" className="text-danger hover:text-danger" onClick={() => { onDelete(task); onClose() }}>
              Удалить
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}