import { Card } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { dollars, pointsUnit } from '../../utils/motivation'

/**
 * Шкала премии: полоса от 0 до 100 баллов с отметками уровней. Над каждой
 * отметкой — сколько стоит уровень при текущем банке, под ней — сколько
 * баллов нужно.
 *
 * Уровень, на котором человек уже стоит, помечается: его сумма больше не
 * растёт от пополнений, деньги идут на уровни выше. Без пометки
 * сотрудник видел бы, что банк вырос, а его сумма нет, и решил бы, что
 * это ошибка.
 */
export function PrizeScale({ prize, highlight }) {
  const pct = Math.min(100, Math.max(0, prize.points))
  const last = prize.levels.length - 1

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="caption">Шкала премии</p>
        <p className="text-sm text-ink-2">
          <span className="font-semibold text-ink tabular-nums">{prize.points}</span> из 100 {pointsUnit(100)}
        </p>
      </div>

      {/* Отступы по бокам — место под подписи крайних отметок, чтобы
          «$250» у правого края не вылезал за карточку на телефоне.
          Сверху на телефоне места больше: там подписи идут в два ряда. */}
      <div className="relative px-3 pt-14 pb-8 sm:pt-9">
        <div className="relative h-2.5 rounded-full bg-panel-2">
          <div className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />

          {prize.levels.map((l, i) => (
            <div
              key={l.position}
              className="absolute top-1/2"
              style={{ left: `${l.threshold}%` }}
            >
              <span
                className={cx(
                  'absolute -translate-x-1/2 -translate-y-1/2 block w-3.5 h-3.5 rounded-full border-2',
                  l.reached ? 'bg-accent border-panel' : 'bg-panel border-line-2',
                )}
              />
              {/* На телефоне между соседними отметками бывает меньше
                  шестидесяти пикселей, и «$135» с «$180» слипались в одно
                  число. Поэтому там подписи через одну подняты на второй
                  ряд: соседние больше не делят одну строку. */}
              <span
                className={cx(
                  'absolute whitespace-nowrap text-xs font-semibold tabular-nums transition-colors sm:bottom-4 sm:text-sm',
                  (last - i) % 2 === 1 ? 'bottom-9' : 'bottom-4',
                  i === last ? '-translate-x-full' : '-translate-x-1/2',
                  l.reached ? 'text-ink' : 'text-ink-2',
                  highlight && !l.fixed && 'text-ok',
                )}
                title={l.fixed ? 'Сумма зафиксирована при выходе на этот уровень' : undefined}
              >
                {dollars(l.amountCents)}
              </span>
              <span
                className={cx(
                  'absolute top-4 whitespace-nowrap text-xs tabular-nums',
                  i === last ? '-translate-x-full' : '-translate-x-1/2',
                  l.reached ? 'text-accent font-semibold' : 'text-ink-3',
                )}
              >
                {l.threshold}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {prize.levels.map((l) => (
          <li
            key={l.position}
            className={cx(
              'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm',
              prize.currentLevel === l.position ? 'border-accent/50 bg-accent-soft' : 'border-line',
            )}
          >
            <span className="text-ink-2">
              Уровень {l.position}
              <span className="text-ink-3"> · {l.threshold} {pointsUnit(l.threshold)} · {l.percent}%</span>
            </span>
            <span className="font-semibold tabular-nums">{dollars(l.amountCents)}</span>
          </li>
        ))}
      </ul>

      {prize.levels.some((l) => l.fixed) && (
        <p className="text-xs text-ink-3 leading-relaxed">
          Сумма пройденного уровня фиксируется в момент выхода на него. Новые пополнения банка поднимают только
          уровни, которые ещё впереди.
        </p>
      )}
    </Card>
  )
}
