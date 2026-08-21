import { Card, EmptyState, Spinner } from '../../shared/ui'
import { TaskCard } from './TaskCard'

export function Column({ col, tasks, loading, currentUser, onMove, onOpen }) {
  return (
    <Card pad="sm" className="flex flex-col gap-3 min-h-[320px]">
      <div className="flex items-center justify-between px-2 pt-1">
        <p className="caption">{col.title}</p>
        <span className="caption !text-accent">{tasks.length}</span>
      </div>

      {loading && <div className="py-10 grid place-items-center"><Spinner size={20} /></div>}
      {!loading && tasks.length === 0 && <EmptyState label="Пусто" />}

      {tasks.map((t) => (
        <TaskCard
          key={t.id}
          task={t}
          col={col}
          isMine={t.ownerId === currentUser?.id}
          onMove={onMove}
          onOpen={onOpen}
        />
      ))}
    </Card>
  )
}
