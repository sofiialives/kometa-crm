import { Card, Badge, AvatarStack, Button } from '../../shared/ui'
import { TaskLine } from './TaskLine'
import { displayName } from '../../utils/admin'
import { taskCount, workBadge } from '../../utils/hierarchy'

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
}) {
  const badge = workBadge(work.status)
  const assignees = (work.assignees || []).map((u) => ({
    id: u.id,
    name: displayName(u),
    src: u.avatarUrl,
  }))

  return (
    <Card pad="md" hover className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mono-caption truncate">
            Клиент · {work.clientName}
            {departmentName ? ' · ' + departmentName : ''}
          </p>
          <h3 className="mt-1 truncate text-[15px] font-semibold tracking-tight">{work.title}</h3>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
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
            <span className="text-[13px] text-ink-3">Исполнители не назначены</span>
          )}
        </button>
        <span className="mono-caption shrink-0">{taskCount(tasks.length)}</span>
      </div>

      <div className="border-t border-white/8 pt-3">
        <span className="mono-caption">Задачи</span>
        {tasks.length === 0 ? (
          <p className="pt-2 text-[13px] text-ink-3">Задач пока нет.</p>
        ) : (
          <div className="pt-1">
            {tasks.map((t) => (
              <TaskLine
                key={t.id}
                task={t}
                canToggle={t.ownerId === currentUser?.id}
                busy={busyTaskId === t.id}
                onToggle={onToggleTask}
              />
            ))}
          </div>
        )}

        <Button variant="ghost" size="sm" className="mt-2 -ml-1" onClick={() => onAddTask(work)}>
          + Добавить задачу
        </Button>
      </div>
    </Card>
  )
}
