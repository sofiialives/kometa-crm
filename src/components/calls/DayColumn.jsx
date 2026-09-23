import { Card } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { CallCard } from './CallCard'

/**
 * Колонка дня повторяет колонку доски «Задачи»: панель, подпись слева,
 * счётчик акцентом справа, карточки стопкой. Отступ внутри панели взят
 * меньше (p-2.5 против p-4 у задач) по одной причине: там колонок три и
 * каждой достаётся под 370px, здесь их семь и на ту же ширину приходится
 * около 157px — с отступом задачника от карточки осталась бы полоска.
 *
 * groups — массив { key, label, calls }. В обычном календаре одна группа
 * без подписи, во «Всех звонках» — по группе на отдел.
 *
 * Прошедшие дни приглушены, но не спрятаны: в сегодняшней колонке до
 * ночной уборки лежат уже состоявшиеся звонки, да и неделя из шести
 * дней выглядела бы сломанной.
 */
export function DayColumn({ day, groups, showOwner, onOpen, onAdd }) {
  const total = groups.reduce((n, g) => n + g.calls.length, 0)

  return (
    <Card
      pad="none"
      className={cx(
        'p-2.5 flex flex-col gap-2 xl:min-h-[180px]',
        day.isToday && 'border-accent/40',
        day.isPast && 'opacity-70',
      )}
    >
      <div className="flex items-center justify-between gap-1.5 px-1 pt-0.5">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span className={cx('text-sm font-semibold', day.isToday ? 'text-accent' : day.isWeekend && 'text-ink-3')}>
            {day.name}
          </span>
          <span className="caption truncate">{day.dayNum}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {total > 0 && <span className="caption !text-accent">{total}</span>}
          {!day.isPast && (
            <button
              type="button"
              onClick={() => onAdd(day.key)}
              title={`Добавить звонок на ${day.full}`}
              aria-label={`Добавить звонок на ${day.full}`}
              className="grid place-items-center w-6 h-6 rounded-lg text-ink-3 hover:text-accent hover:bg-accent-soft transition-colors cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {total === 0 ? (
        <p className="caption px-1 py-2 opacity-60">—</p>
      ) : (
        groups.map((g) =>
          g.calls.length === 0 ? null : (
            <div key={g.key} className="flex flex-col gap-2">
              {g.label && (
                <div className="flex items-center gap-2 px-1 pt-1">
                  <p className="caption truncate">{g.label}</p>
                  <span className="h-px flex-1 bg-line" />
                </div>
              )}
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
