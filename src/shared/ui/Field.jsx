import { useId } from 'react'
import { cx } from '../lib/cx'

export function Field({ label, hint, error, required, htmlFor, children, className }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="mono-caption select-none">
          {label}
          {required && <span className="text-brand-light ml-1">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[12.5px] text-danger leading-snug">{error}</p>
      ) : hint ? (
        <p className="text-[12.5px] text-ink-3 leading-snug">{hint}</p>
      ) : null}
    </div>
  )
}

export function controlClasses({ error, size = 'md' }) {
  return cx(
    'w-full bg-white/[0.04] border text-ink placeholder:text-ink-3',
    'rounded-[--radius-field] outline-none transition-all duration-200',
    'focus:border-brand-purple/70 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(133,76,255,0.15)]',
    size === 'sm' ? 'h-9 px-3 text-[13.5px]' : 'h-11 px-4 text-sm',
    error ? 'border-danger/60' : 'border-white/12',
  )
}

export function useFieldId(propId) {
  const autoId = useId()
  return propId || autoId
}
