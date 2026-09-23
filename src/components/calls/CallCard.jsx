import { Avatar, Badge } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { callTime, isPastCall, isTodayCall, shortName } from '../../utils/calls'

/**
 * Карточка говорит языком доски «Задачи» — та же панель, тот же радиус,
 * те же метки Badge с тонами, — но порядок строк свой: в календаре
 * первым читается время, а не название. Метка стоит у правого края, а не
 * впритык ко времени: прижатая к нему, она выглядела наклейкой.
 *
 * Отдел на карточке не пишем: во «Всех звонках» он уже стоит заголовком
 * группы прямо над ней, а в колонке шириной 159px строка «Николай Волков
 * · Дизайн» переносилась на три строки и растягивала карточку вдвое.
 */
export function CallCard({ call, onOpen, showOwner = false }) {
  const past = isPastCall(call.scheduledAt)
  const today = isTodayCall(call.scheduledAt)
  const owner = call.owner?.name?.trim() || 'Без имени'

  return (
    <div
      onClick={() => onOpen(call)}
      className={cx(
        'panel rounded-2xl p-3 flex flex-col gap-2 transition-colors cursor-pointer',
        past ? 'opacity-70' : 'hover:border-accent/35',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cx('text-sm font-semibold tabular-nums', past ? 'text-ink-3' : 'text-accent')}>
          {callTime(call.scheduledAt)}
        </span>
        {past ? (
          <Badge tone="neutral">Прошёл</Badge>
        ) : today ? (
          <Badge tone="brand">Сегодня</Badge>
        ) : null}
      </div>

      <div>
        <p className={cx('text-sm leading-snug', past && 'text-ink-3')}>{call.title}</p>
        {call.note && (
          <p className="text-xs text-ink-3 leading-relaxed mt-1 line-clamp-2">{call.note}</p>
        )}
      </div>

      {showOwner && (
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={owner} src={call.owner?.avatarUrl} color={call.owner?.avatarColor} size={20} />
          <span className="caption truncate" title={owner}>{shortName(owner)}</span>
        </div>
      )}
    </div>
  )
}
