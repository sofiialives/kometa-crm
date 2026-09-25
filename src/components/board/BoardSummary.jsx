import { Card } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { money } from '../../utils/board'

/**
 * Сводка в шапке доски. Пересчитывается под выбранный период — кроме
 * количества клиентов: колонка это текущее состояние, а не срез по месяцу.
 *
 * Прибыль подкрашиваем: красная прибыль означает, что за период расходы
 * съели выручку, и это надо замечать сразу, а не вычитать в уме.
 */
export function BoardSummary({ summary, periodLabel }) {
  const tiles = [
    { label: `Выручка · ${periodLabel}`, value: money(summary?.revenueCents) },
    {
      label: `Прибыль · ${periodLabel}`,
      value: money(summary?.profitCents),
      tone: (summary?.profitCents ?? 0) < 0 ? 'text-danger' : 'text-ok',
    },
    { label: 'Клиентов в работе', value: summary?.activeCount ?? 0 },
    { label: 'Клиентов ушло', value: summary?.leftCount ?? 0, tone: 'text-ink-2' },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} pad="sm" className="flex flex-col gap-1.5">
          <p className="caption">{t.label}</p>
          <p className={cx('font-display text-2xl font-bold tracking-tight tabular-nums', t.tone)}>{t.value}</p>
        </Card>
      ))}
    </div>
  )
}
