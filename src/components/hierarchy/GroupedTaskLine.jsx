import { useState } from 'react'
import { AvatarStack, Badge } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { aggregateTaskBadge } from '../../utils/hierarchy'
import { priorityMeta } from '../../utils/tasks'
import { TaskLine } from './TaskLine'

const PRIORITY_DOT = { neutral: 'bg-ink-3', warn: 'bg-warn', danger: 'bg-danger' }

/**
 * Одна и та же задача, поставленная разом на нескольких исполнителей, —
 * на бэке это отдельная запись на каждого (см. AddTaskModal), а здесь
 * схлопнута в одну строку с несколькими аватарками. Разворачивается по
 * клику в обычные TaskLine — там toggle/open продолжают работать с
 * конкретной задачей конкретного человека, как и раньше.
 */
export function GroupedTaskLine({ tasks, currentUser, busyTaskId, onToggle, onOpen }) {
  const [open, setOpen] = useState(false)

  const first = tasks[0]
  const badge = aggregateTaskBadge(tasks)
  const priority = priorityMeta(first.priority)
  const owners = tasks.map((t) => ({
    id: t.owner?.id ?? t.ownerId,
    name: t.owner?.name,
    src: t.owner?.avatarUrl,
    color: t.owner?.avatarColor,
  }))

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-w-0 items-center gap-3 py-2 text-left cursor-pointer"
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className={cx('shrink-0 text-ink-3 transition-transform duration-150', open && 'rotate-90')}
        >
          <path d="M9 6l6 6-6 6" />
        </svg>

        <AvatarStack users={owners} size={22} className="shrink-0" />

        <span
          className={cx('h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[priority.tone])}
          title={`Приоритет: ${priority.label}`}
        />

        <p className="min-w-0 flex-1 truncate text-sm text-ink-2">{first.title}</p>

        <span className="caption shrink-0">{tasks.length} чел.</span>
        <Badge tone={badge.tone} className="shrink-0">{badge.label}</Badge>
      </button>

      {open && (
        <div className="ml-5 flex flex-col border-l border-line pl-3">
          {tasks.map((t) => (
            <TaskLine
              key={t.id}
              task={t}
              canToggle={t.ownerId === currentUser?.id}
              busy={busyTaskId === t.id}
              onToggle={onToggle}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  )
}
