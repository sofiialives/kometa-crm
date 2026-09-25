import { Badge, Button, Card } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { dateLabel, money, servicesWord, tenure } from '../../utils/board'

/**
 * Свёрнутая карточка клиента.
 *
 * Деньги здесь — за выбранный период, иначе переключение месяцев ничего бы
 * не меняло. А «дней с нами» и «услуг за всё время» остаются общими: так
 * помечено в задании, и по смыслу они к периоду не относятся.
 */
export function BoardCard({ card, onOpen, onLeave, onReturn, periodLabel }) {
  const left = card.status === 'left'
  const empty = card.serviceCountInPeriod === 0

  return (
    <Card
      hover
      pad="sm"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      className={cx('flex cursor-pointer flex-col gap-3', left && 'opacity-80')}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 truncate font-semibold leading-snug">{card.client.name}</p>
        {left
          ? <Badge tone="danger">Ушёл</Badge>
          : <Badge tone="ok">В работе</Badge>}
      </div>

      <div className="flex flex-col gap-1">
        <Row label={`Выручка · ${periodLabel}`} value={money(card.revenueCents)} muted={empty} />
        <Row
          label={`Прибыль · ${periodLabel}`}
          value={money(card.profitCents)}
          tone={card.profitCents < 0 ? 'text-danger' : 'text-ok'}
          muted={empty}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
        <span>с нами {tenure(card.daysWithUs)}</span>
        <span aria-hidden="true">·</span>
        <span>{servicesWord(card.serviceCountTotal)} за всё время</span>
      </div>

      {left && card.leftReason && (
        <p className="truncate text-xs text-ink-3" title={card.leftReason}>
          Ушёл {dateLabel(card.leftAt)} — {card.leftReason}
        </p>
      )}

      {empty && !left && <p className="text-xs text-warn">В этом периоде услуг не было</p>}

      {/* Перенос между колонками прямо с карточки — как стрелки в
          Задачнике. Иначе пришлось бы открывать карточку ради одного
          действия, которое делают чаще всего.
          stopPropagation: клик по кнопке не должен раскрывать карточку. */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {left ? (
          <Button size="sm" variant="outline" className="flex-1" onClick={onReturn}>
            ← Вернуть в работу
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="flex-1" onClick={onLeave}>
            Клиент ушёл →
          </Button>
        )}
      </div>
    </Card>
  )
}

function Row({ label, value, tone, muted }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="caption truncate">{label}</span>
      <span className={cx('text-sm font-semibold tabular-nums', muted ? 'text-ink-3' : tone)}>{value}</span>
    </div>
  )
}
