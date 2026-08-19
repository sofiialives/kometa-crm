import { useFieldId } from './Field'
import { cx } from '../lib/cx'

export function Checkbox({ label, id: propId, className, ...props }) {
  const id = useFieldId(propId)
  return (
    <label htmlFor={id} className={cx('inline-flex items-center gap-2.5 cursor-pointer select-none group', className)}>
      <input id={id} type="checkbox" className="peer sr-only" {...props} />
      <span
        className={cx(
          'grid place-items-center w-5 h-5 rounded-md border border-white/25 bg-white/[0.04]',
          'transition-all duration-150 group-hover:border-brand-purple/60',
          'peer-checked:border-transparent peer-checked:bg-gradient-to-br peer-checked:from-brand-blue peer-checked:to-brand-purple',
          'peer-checked:[&>svg]:opacity-100',
          'peer-focus-visible:shadow-[0_0_0_3px_rgba(133,76,255,0.25)]',
        )}
      >
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"
          strokeLinecap="round" strokeLinejoin="round" className="opacity-0 transition-opacity duration-150"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      {label && <span className="text-sm text-ink-2">{label}</span>}
    </label>
  )
}
