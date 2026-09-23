import { Avatar, Badge } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { callTime, isPastCall, isTodayCall, shortName } from '../../utils/calls'

/**
 * Карточка говорит языком доски «Задачи» — та же панель, тот же радиус,
 * те же метки Badge с тонами, — но порядок строк свой: в календаре
 * первым читается время, а не название.
 *
 * Время и метка идут парой с переносом, а не прижатыми к разным краям.
 * Причина в замерах: в колонке дня карточке достаётся 113px под контент,
 * время занимает 39, метка 67 — между ними оставалось 7px, и они
 * слипались. На телефоне та же строка растягивалась на 328px, и метка
 * улетала от времени на 198px, теряя с ним связь. С переносом узкая
 * колонка кладёт метку на строку ниже, широкая оставляет рядом, и
 * расстояние в обоих случаях одинаковое.
 *
 * Отдел на карточке не пишем: во «Всех звонках» он уже стоит заголовком
 * группы прямо над ней, а в узкой колонке строка «Николай Волков ·
 * Дизайн» переносилась на три строки и растягивала карточку вдвое.
 */
export function CallCard({ call, onOpen, showOwner = false }) {
  const past = isPastCall(call.scheduledAt)
  const today = isTodayCall(call.scheduledAt)
  const owner = call.owner?.name?.trim() || 'Без имени'

  return (
    <div
      onClick={() => onOpen(call)}
      className={cx(
        'panel rounded-2xl p-3.5 flex flex-col gap-2.5 transition-colors cursor-pointer',
        past ? 'opacity-70' : 'hover:border-accent/35',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <span className={cx('text-sm font-semibold tabular-nums', past ? 'text-ink-3' : 'text-accent')}>
          {callTime(call.scheduledAt)}
        </span>
        {past ? (
          <Badge tone="danger">Прошёл</Badge>
        ) : today ? (
          <Badge tone="now">Сегодня</Badge>
        ) : null}
      </div>

      <div>
        <p className={cx('text-sm leading-snug', past && 'text-ink-3')}>{call.title}</p>
        {call.note && (
          <p className="text-xs text-ink-3 leading-relaxed mt-1.5 line-clamp-2">{call.note}</p>
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
