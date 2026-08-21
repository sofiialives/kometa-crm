import { cx } from '../lib/cx'

const tones = {
  ok: 'bg-ok/10 text-ok border-ok/30',
  warn: 'bg-warn/10 text-warn border-warn/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  brand: 'bg-brand-purple/12 text-brand-light border-brand-purple/35',
  neutral: 'bg-surface-3 text-ink-3 border-line',
}

export function Badge({ tone = 'neutral', dot = true, className, children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border',
        'font-mono text-[10px] uppercase tracking-wider whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
