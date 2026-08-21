import { Card, Badge, AvatarStack, Button, AddAction } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { TaskLine } from './TaskLine'
import { displayName } from '../../utils/admin'
import { taskCount, workBadge } from '../../utils/hierarchy'

// Корешок слева повторяет статус работы: в списке из десятка карточек
// состояние видно, не читая бейдж.
const SPINE = { active: 'spine--accent', done: 'spine--ok', archived: 'spine--muted' }

export function WorkCard({
  work,
  departmentName,
  tasks,
  currentUser,
  busyTaskId,
  canManage,
  onToggleTask,
  onAddTask,
  onEditAssignees,
  onEditTask,
  onExtendTask,
  onDeleteTask,
  onDeleteWork,
}) {
  const badge = workBadge(work.status)
  const assignees = (work.assignees || []).map((u) => ({
    id: u.id,
    name: displayName(u),
    src: u.avatarUrl,
    color: u.avatarColor,
  }))

  return (
    <Card pad="md" hover className={cx('spine flex flex-col gap-4', SPINE[work.status] || 'spine--accent')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="caption truncate">
            Клиент · {work.clientName}
            {departmentName ? ' · ' + departmentName : ''}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold tracking-tight">{work.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={badge.tone}>{badge.label}</Badge>
          {canManage && (
            <button
              onClick={() => onDeleteWork(work)}
              aria-label="Удалить работу"
              title="Удалить работу"
              className="grid h-6 w-6 place-items-center rounded-md text-ink-3 transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={canManage ? onEditAssignees : undefined}
          disabled={!canManage}
          title={canManage ? 'Изменить исполнителей' : undefined}
          className={canManage ? 'cursor-pointer' : 'cursor-default'}
        >
          {assignees.length > 0 ? (
            <AvatarStack users={assignees} size={28} />
          ) : (
            <span className="text-sm text-ink-3">Исполнители не назначены</span>
          )}
        </button>
        <span className="caption shrink-0">{taskCount(tasks.length)}</span>
      </div>

      <div className="border-t border-line pt-3">
        <span className="caption">Задачи</span>
        {tasks.length === 0 ? (
          <p className="pt-2 text-sm text-ink-3">Задач пока нет.</p>
        ) : (
          <div className="pt-1">
            {tasks.map((t) => (
              <TaskLine
                key={t.id}
                task={t}
                canToggle={t.ownerId === currentUser?.id}
                canManage={canManage}
                busy={busyTaskId === t.id}
                onToggle={onToggleTask}
                onEdit={onEditTask}
                onExtend={onExtendTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        )}

        {canManage && (
          <AddAction className="mt-3" onClick={() => onAddTask(work)}>
            Добавить задачу
          </AddAction>
        )}
      </div>
    </Card>
  )
}
