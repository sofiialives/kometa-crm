import { cx } from '../lib/cx'
import { PRIORITY_OPTIONS } from '../../utils/tasks'

const activeTone = {
  neutral: 'bg-panel-2 border-line text-ink',
  warn: 'bg-warn-soft border-warn/50 text-warn',
  danger: 'bg-danger-soft border-danger/50 text-danger',
}

export function PriorityPicker({ value, onChange, label = 'Приоритет' }) {
  return (
    <div>
      {label && <p className="caption mb-1.5">{label}</p>}
      <div className="flex gap-2">
        {PRIORITY_OPTIONS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={cx(
              'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
              value === p.value ? activeTone[p.tone] : 'border-line text-ink-3 hover:text-ink hover:border-ink-3',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
