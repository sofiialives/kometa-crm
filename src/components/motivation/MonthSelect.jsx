import { Select } from '../../shared/ui'
import { monthHeading } from '../../utils/motivation'

/**
 * Переключатель месяца. Для прошлых месяцев экран показывает итог: баллы,
 * банк, сумму премии и уровень работы на конец месяца.
 */
export function MonthSelect({ months = [], value, onChange, currentLabel = 'текущий', className }) {
  const options = months.map((m, i) => ({
    value: m,
    label: i === 0 ? `${monthHeading(m)} — ${currentLabel}` : monthHeading(m),
  }))
  return (
    <Select
      className={className}
      size="sm"
      options={options}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Месяц"
    />
  )
}
