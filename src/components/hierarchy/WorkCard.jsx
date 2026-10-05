import { useMemo, useState } from 'react'
import { Card, Badge, AvatarStack, AddAction } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { TaskLine } from './TaskLine'
import { GroupedTaskLine } from './GroupedTaskLine'
import {
  taskCount,
  workBadge,
  sortTasks,
  groupTasksForDisplay,
  applyRowOrder,
  reorderRows,
} from '../../utils/hierarchy'

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
  onEditClient,
  onOpenTask,
  onDeleteWork,
}) {
  const badge = workBadge(work.status)
  const assignees = (work.assignees || []).map((u) => ({
    id: u.id,
    name: u.name,
    src: u.avatarUrl,
    color: u.avatarColor,
  }))

  // Порядок строк (ручная перестановка хранится в localStorage и не
  // триггерит ре-рендер сама по себе, поэтому дёргаем счётчик вручную
  // после drop) + схлопывание задач, поставленных разом на нескольких
  // исполнителей, в одну строку с несколькими аватарками.
  const [orderTick, setOrderTick] = useState(0)
  const rows = useMemo(
    () => applyRowOrder(groupTasksForDisplay(sortTasks(tasks)), work.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, work.id, orderTick],
  )

  const [dragKey, setDragKey] = useState(null)
  const [overKey, setOverKey] = useState(null)

  function handleDrop(targetKey) {
    if (dragKey && targetKey && dragKey !== targetKey) {
      reorderRows(rows, work.id, dragKey, targetKey)
      setOrderTick((v) => v + 1)
    }
    setDragKey(null)
    setOverKey(null)
  }

  return (
    <Card pad="md" hover className={cx('spine flex flex-col gap-4', SPINE[work.status] || 'spine--accent')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="caption truncate">
            Клиент ·{' '}
            {canManage ? (
              <button
                onClick={() => onEditClient(work)}
                className={cx(
                  'cursor-pointer underline decoration-dotted underline-offset-2 hover:text-ink',
                  !work.client && 'text-danger',
                )}
                title="Изменить клиента"
              >
                {work.client?.name || 'без клиента — нажмите, чтобы указать'}
              </button>
            ) : (
              work.client?.name || 'без клиента'
            )}
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
        {rows.length === 0 ? (
          <p className="pt-2 text-sm text-ink-3">Задач пока нет.</p>
        ) : (
          <div className="pt-1">
            {rows.map((row) => (
              <div
                key={row.rowKey}
                onDragOver={
                  canManage
                    ? (e) => {
                        if (!dragKey) return
                        e.preventDefault()
                        if (overKey !== row.rowKey) setOverKey(row.rowKey)
                      }
                    : undefined
                }
                onDragLeave={canManage ? () => setOverKey((k) => (k === row.rowKey ? null : k)) : undefined}
                onDrop={canManage ? (e) => { e.preventDefault(); handleDrop(row.rowKey) } : undefined}
                className={cx(
                  'flex items-center gap-1 rounded-lg transition-colors',
                  canManage && 'group',
                  dragKey === row.rowKey && 'opacity-40',
                  overKey === row.rowKey && dragKey && dragKey !== row.rowKey && 'bg-accent/10',
                )}
              >
                {canManage && (
                  // draggable только на самой ручке, а не на всей строке —
                  // иначе клик по чекбоксу/названию внутри норовит начать
                  // перетаскивание вместо обычного клика.
                  <span
                    draggable
                    onDragStart={() => setDragKey(row.rowKey)}
                    onDragEnd={() => { setDragKey(null); setOverKey(null) }}
                    className="shrink-0 cursor-grab text-ink-3 opacity-0 transition-opacity group-hover:opacity-60 active:cursor-grabbing"
                    title="Перетащите, чтобы изменить порядок"
                  >
                    <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                      <circle cx="3" cy="3" r="1.3" /><circle cx="9" cy="3" r="1.3" />
                      <circle cx="3" cy="8" r="1.3" /><circle cx="9" cy="8" r="1.3" />
                      <circle cx="3" cy="13" r="1.3" /><circle cx="9" cy="13" r="1.3" />
                    </svg>
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {row.isGroup ? (
                    <GroupedTaskLine
                      tasks={row.tasks}
                      currentUser={currentUser}
                      busyTaskId={busyTaskId}
                      onToggle={onToggleTask}
                      onOpen={onOpenTask}
                    />
                  ) : (
                    <TaskLine
                      task={row.tasks[0]}
                      canToggle={row.tasks[0].ownerId === currentUser?.id}
                      busy={busyTaskId === row.tasks[0].id}
                      onToggle={onToggleTask}
                      onOpen={onOpenTask}
                    />
                  )}
                </div>
              </div>
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
