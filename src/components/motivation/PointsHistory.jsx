import { Button, Card, EmptyState } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { dateTime, entryKindLabel, pointsTone, signedPoints } from '../../utils/motivation'
import { withPlural } from '../../shared/lib/plural'

/**
 * История баллов за месяц: дата, событие, баллы (плюс зелёным, минус
 * красным), к какой задаче или клиенту относится, комментарий. Новые
 * сверху.
 *
 * Отменённое не пропадает: оно зачёркнуто, рядом — кто, когда и почему
 * отменил. Так в задании: удалять события нельзя, только отменять с
 * комментарием, и след остаётся.
 */
export function PointsHistory({ history, canCancel, onCancel }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="caption">История баллов</p>
        <p className="text-xs text-ink-3">{history.length ? withPlural(history.length, 'запись', 'записи', 'записей') : ''}</p>
      </div>

      {history.length === 0 ? (
        <EmptyState label="Пока пусто" text="Здесь появятся события, за которые добавляются и снимаются баллы." />
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {history.map((e) => (
            <HistoryRow key={e.id} entry={e} canCancel={canCancel} onCancel={onCancel} />
          ))}
        </ul>
      )}
    </Card>
  )
}

function HistoryRow({ entry, canCancel, onCancel }) {
  const cancelled = Boolean(entry.cancelled)
  const samePoints = entry.prizePoints === entry.levelPoints

  return (
    <li className={cx('flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0', entry.isNew && 'animate-fade-in')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className={cx('text-sm font-medium leading-snug', cancelled && 'line-through text-ink-3')}>
            {entry.title}
            {entry.isNew && <span className="ml-2 rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent no-underline">новое</span>}
          </p>
          <p className="text-xs text-ink-3">
            {dateTime(entry.occurredAt)} · {entryKindLabel(entry)}
            {entry.createdBy ? ` · ${entry.createdBy.name}` : ''}
          </p>
        </div>

        <div className={cx('shrink-0 text-right tabular-nums', cancelled && 'line-through opacity-50')}>
          <p className={cx('text-base font-semibold', pointsTone(entry.prizePoints))}>{signedPoints(entry.prizePoints)}</p>
          {!samePoints && (
            <p className={cx('text-xs', pointsTone(entry.levelPoints))}>{signedPoints(entry.levelPoints)} в уровень</p>
          )}
        </div>
      </div>

      {(entry.task || entry.client) && (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2">
          {entry.task && <span>Задача: «{entry.task.title}»</span>}
          {entry.client && <span>Клиент: {entry.client.name}</span>}
        </p>
      )}

      {entry.comment && <p className="text-sm text-ink-2 leading-relaxed">{entry.comment}</p>}

      {cancelled && (
        <p className="text-xs text-danger leading-relaxed">
          Отменено {dateTime(entry.cancelled.at)}
          {entry.cancelled.by ? `, ${entry.cancelled.by.name}` : ''}: {entry.cancelled.reason}
        </p>
      )}

      {canCancel && !cancelled && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => onCancel(entry)}>Отменить</Button>
        </div>
      )}
    </li>
  )
}
