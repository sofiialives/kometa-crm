import { Card } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { CallCard } from './CallCard'

/**
 * Колонка одного дня недели.
 *
 * groups — массив { key, label, calls }. В обычном календаре это одна
 * группа без подписи, во «Всех звонках» — по группе на отдел с мелким
 * заголовком. Так группировка по отделам не ломает форму календаря:
 * неделя остаётся неделей, а отделы читаются внутри дня.
 *
 * Прошедшие дни приглушены, но не спрятаны: в сегодняшней колонке до
 * ночной уборки лежат уже состоявшиеся звонки, да и неделя из шести
 * дней выглядела бы сломанной.
 */
export function DayColumn({ day, groups, showOwner, onOpen, onAdd }) {
  const total = groups.reduce((n, g) => n + g.calls.length, 0)

  return (
    <Card
      pad="sm"
      className={cx(
        // Одинаковая высота колонок нужна только там, где семь дней
        // стоят рядом настоящей сеткой. На телефоне они идут стопкой,
        // и пустой понедельник высотой в 180px — это два экрана
        // прокрутки до сегодняшнего дня.
        'flex flex-col gap-2 xl:min-h-[180px]',
        day.isToday && 'border-accent/40',
        day.isPast && 'opacity-70',
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className={cx('text-sm font-semibold', day.isToday ? 'text-accent' : day.isWeekend && 'text-ink-3')}>
            {day.name}
          </span>
          <span className="caption truncate">{day.dayNum}</span>
        </div>

        {!day.isPast && (
          <button
            type="button"
            onClick={() => onAdd(day.key)}
            title={`Добавить звонок на ${day.full}`}
            aria-label={`Добавить звонок на ${day.full}`}
            className="shrink-0 grid place-items-center w-6 h-6 rounded-lg text-ink-3 hover:text-accent hover:bg-accent-soft transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>

      {total === 0 ? (
        <p className="caption px-1 py-2 opacity-60">—</p>
      ) : (
        groups.map((g) =>
          g.calls.length === 0 ? null : (
            <div key={g.key} className="flex flex-col gap-2">
              {g.label && <p className="caption px-1 pt-1">{g.label}</p>}
              {g.calls.map((c) => (
                <CallCard key={c.id} call={c} onOpen={onOpen} showOwner={showOwner} />
              ))}
            </div>
          ),
        )
      )}
    </Card>
  )
}
