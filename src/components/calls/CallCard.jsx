import { Avatar, Badge } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { callTime, isPastCall } from '../../utils/calls'

/**
 * showOwner — во «Всех звонках» и у главного отдела важно, чей это
 * звонок; в своём календаре аватар самого себя рядом с каждой карточкой
 * только шумит, поэтому там он скрыт.
 */
export function CallCard({ call, onOpen, showOwner = false }) {
  const past = isPastCall(call.scheduledAt)

  return (
    <button
      type="button"
      onClick={() => onOpen(call)}
      className={cx(
        'panel w-full text-left rounded-xl p-2.5 flex flex-col gap-1.5 transition-colors cursor-pointer',
        past ? 'opacity-55' : 'hover:border-accent/35',
      )}
    >
      <div className="flex items-baseline gap-2">
        <span className={cx('text-sm font-semibold tabular-nums', past ? 'text-ink-3' : 'text-accent')}>
          {callTime(call.scheduledAt)}
        </span>
        {past && <Badge tone="neutral">Прошёл</Badge>}
      </div>

      <p className={cx('text-sm leading-snug line-clamp-2', past && 'text-ink-3')}>{call.title}</p>

      {call.note && <p className="text-xs text-ink-3 leading-relaxed line-clamp-2">{call.note}</p>}

      {showOwner && call.owner && (
        <div className="flex items-center gap-1.5 min-w-0 pt-0.5">
          <Avatar name={call.owner.name} src={call.owner.avatarUrl} color={call.owner.avatarColor} size={18} />
          <span className="caption truncate">{call.owner.name}</span>
        </div>
      )}
    </button>
  )
}
