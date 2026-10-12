import { Card } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { pointsWord } from '../../utils/motivation'

/**
 * Уровень работы: полоса из зон с названиями, текущая выделена, под ней
 * название и подсказка из профиля. Денег здесь нет — это оценка месяца
 * словами, а премию определяет шкала выше.
 *
 * Ширина зоны пропорциональна её диапазону баллов: «Сильный результат» с
 * 60 до 79 уже, чем «Разгоняемся» с 0 до 29, и полоса должна это показывать.
 */
export function WorkLevelBar({ work }) {
  if (!work.current) return null
  const span = (l) => l.maxPoints - l.minPoints + 1

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="caption">Уровень работы</p>
        <p className="text-sm text-ink-2">
          <span className="font-semibold text-ink tabular-nums">{work.points}</span> из 100
        </p>
      </div>

      <div className="flex gap-1">
        {work.levels.map((l, i) => {
          const active = i === work.current.index
          return (
            <div key={l.position} className="flex min-w-0 flex-col gap-1.5" style={{ flex: span(l) }}>
              <div
                className={cx(
                  'h-2.5 rounded-full transition-colors',
                  active ? 'bg-accent' : i < work.current.index ? 'bg-accent/40' : 'bg-panel-2',
                )}
              />
              <span className={cx('truncate text-xs', active ? 'font-semibold text-ink' : 'text-ink-3')} title={l.title}>
                {l.title}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg bg-panel-2 px-4 py-3">
        <p className="font-semibold">{work.current.title}</p>
        {work.current.hint && <p className="text-sm text-ink-2 leading-relaxed">{work.current.hint}</p>}
        {work.next && (
          <p className="text-xs text-ink-3">
            До уровня «{work.next.title}» осталось {pointsWord(work.pointsLeft)}
          </p>
        )}
      </div>
    </Card>
  )
}
