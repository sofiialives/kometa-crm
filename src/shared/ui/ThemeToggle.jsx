import { useThemeStore, THEMES } from '../../core/store/themeStore'
import { cx } from '../lib/cx'

const ICONS = {
  system: 'M9 21h6M12 17v4M4 5h16v12H4z',
  dark: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
  light: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7l1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2l-1.4-1.4M16 12a4 4 0 11-8 0 4 4 0 018 0z',
}

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  return (
    <div className="inline-flex items-center gap-0.5 rounded-xl border border-line bg-surface-3 p-0.5" role="group" aria-label="Тема оформления">
      {THEMES.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          title={t.label}
          aria-label={t.label}
          aria-pressed={theme === t.value}
          className={cx(
            'grid h-8 w-8 place-items-center rounded-[9px] transition-colors cursor-pointer',
            theme === t.value
              ? 'bg-gradient-to-br from-brand-blue to-brand-purple text-white'
              : 'text-ink-3 hover:text-ink hover:bg-space-2',
          )}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICONS[t.value]} />
          </svg>
        </button>
      ))}
    </div>
  )
}
