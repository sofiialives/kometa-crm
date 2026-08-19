import { Field, controlClasses, useFieldId } from './Field'
import { cx } from '../lib/cx'

export function Select({
  label,
  hint,
  error,
  required,
  size = 'md',
  options = [],
  placeholder,
  id: propId,
  className,
  ...props
}) {
  const id = useFieldId(propId)
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={className}>
      <div className="relative">
        <select
          id={id}
          className={cx(controlClasses({ error, size }), 'appearance-none pr-10 cursor-pointer [&>option]:bg-space-2')}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-3"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </Field>
  )
}
