import { cx } from '../../shared/lib/cx'

/**
 * Разделы вкладки — те же круглые переключатели, что над доской клиентов.
 * badge — число рядом с названием («На проверке · 3»), ноль не показываем.
 */
export function SectionTabs({ sections, value, onChange }) {
  if (sections.length < 2) return null
  return (
    <div className="flex flex-wrap gap-2" role="tablist">
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={value === s.id}
          onClick={() => onChange(s.id)}
          className={cx(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
            value === s.id ? 'bg-accent text-white' : 'panel text-ink-3 hover:text-ink',
          )}
        >
          {s.label}
          {s.badge > 0 && (
            <span className={cx('ml-2 rounded-full px-1.5 text-xs tabular-nums', value === s.id ? 'bg-white/25' : 'bg-accent-soft text-accent')}>
              {s.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
