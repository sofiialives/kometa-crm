import { useMemo } from 'react'
import { Card, EmptyState, Spinner } from '../../shared/ui'
import { TaskCard } from './TaskCard'
import { isFutureDayMsk } from '../../utils/tasks'

export function Column({ col, tasks, loading, currentUser, onMove, onOpen, splitFuture = false }) {
  // Задачи, поставленные наперёд, лежат в том же столбце, что и сегодняшние:
  // статус у них общий. Но в счётчике «Сегодня» им не место — иначе утром
  // видно «6», когда на сегодня всего две. Поэтому отделяем их подзаголовком.
  const [now, later] = useMemo(() => {
    if (!splitFuture) return [tasks, []]
    const a = [], b = []
    for (const t of tasks) (isFutureDayMsk(t.deadline) ? b : a).push(t)
    return [a, b]
  }, [tasks, splitFuture])

  const render = (t) => (
    <TaskCard
      key={t.id}
      task={t}
      col={col}
      isMine={t.ownerId === currentUser?.id}
      isAdminDiary={currentUser?.role === 'admin' && t.ownerId === currentUser?.id}
      onMove={onMove}
      onOpen={onOpen}
    />
  )

  return (
    <Card pad="sm" className="flex flex-col gap-3 min-h-[320px]">
      <div className="flex items-center justify-between px-2 pt-1">
        <p className="caption">{col.title}</p>
        <span className="caption !text-accent">{now.length}</span>
      </div>

      {loading && <div className="py-10 grid place-items-center"><Spinner size={20} /></div>}
      {!loading && now.length === 0 && later.length === 0 && <EmptyState label="Пусто" />}

      {now.map(render)}

      {later.length > 0 && (
        <>
          <div className="flex items-center justify-between px-2 pt-2">
            <p className="caption">Дальше</p>
            <span className="caption">{later.length}</span>
          </div>
          {later.map(render)}
        </>
      )}
    </Card>
  )
}