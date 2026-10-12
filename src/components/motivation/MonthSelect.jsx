import { Select } from '../../shared/ui'
import { monthHeading } from '../../utils/motivation'

/**
 * Переключатель месяца. Для прошлых месяцев экран показывает итог: баллы,
 * банк, сумму премии и уровень работы на конец месяца.
 */
export function MonthSelect({ months = [], current, value, onChange, className }) {
  // «Текущий» — по месяцу, который назвал сервер, а не по первому в списке:
  // в список может попасть и прошлый месяц, если его открыли по ссылке.
  const options = months.map((m) => ({
    value: m,
    label: m === current ? `${monthHeading(m)} — текущий` : monthHeading(m),
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
