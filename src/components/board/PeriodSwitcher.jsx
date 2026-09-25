import { DatePicker, Select } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { dayKey, monthOptions } from '../../utils/board'

const MODES = [
  { id: 'month', label: 'Месяц' },
  { id: 'all', label: 'За всё время' },
  { id: 'period', label: 'Период' },
]

/**
 * Переключатель периода над доской. Три режима из задания: конкретный
 * месяц, всё время и произвольный диапазон.
 *
 * Данные помесячные, поэтому в режиме периода месяц попадает в выборку,
 * если его первое число лежит в диапазоне. Пишем это подсказкой под полями:
 * иначе «с 15 сентября» молча не захватит сентябрь, и человек решит, что
 * цифры врут.
 */
export function PeriodSwitcher({ value, onChange, monthsWithData }) {
  const set = (patch) => onChange({ ...value, ...patch })
  // В списке обязательно есть выбранный месяц, иначе Select показал бы
  // первую строку, а доска считала бы совсем другой месяц.
  const months = monthOptions(monthsWithData, value.month)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => set({ mode: m.id })}
            className={cx(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
              value.mode === m.id ? 'bg-accent text-white' : 'panel text-ink-3 hover:text-ink',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {value.mode === 'month' && (
        <div className="max-w-xs">
          <Select
            label="Месяц"
            value={value.month || ''}
            onChange={(e) => set({ month: e.target.value })}
            options={months}
          />
        </div>
      )}

      {value.mode === 'period' && (
        <div className="flex flex-col gap-2">
          <div className="grid gap-3 sm:grid-cols-2 max-w-lg">
            <DatePicker label="С" value={value.from || ''} onChange={(v) => set({ from: v })} today={dayKey()} />
            <DatePicker label="По" value={value.to || ''} onChange={(v) => set({ to: v })} today={dayKey()} />
          </div>
          <p className="text-xs text-ink-3">
            Месяц попадает в период, если его первое число лежит в выбранном диапазоне. Половины месяца не бывает.
          </p>
        </div>
      )}
    </div>
  )
}
