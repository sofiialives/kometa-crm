import { cx } from '../lib/cx'
import { Spinner } from './Spinner'

/*
 * Кнопки различаются заливкой и границей, а не свечением. Раньше вторичные
 * держались на полупрозрачном белом и терялись на фоне — теперь у каждой
 * своя поверхность, а при наведении меняется и фон, и граница.
 */
const variants = {
  primary:
    'bg-accent text-on-accent border border-accent hover:bg-accent-hover hover:border-accent-hover',
  secondary:
    'bg-panel text-ink border border-line-2 hover:bg-panel-2 hover:border-ink-3',
  outline:
    'bg-transparent text-ink-2 border border-line-2 hover:text-ink hover:border-ink-3 hover:bg-panel-2',
  ghost:
    'bg-transparent text-ink-2 border border-transparent hover:text-ink hover:bg-panel-2 hover:border-line',
  quiet:
    'bg-transparent text-accent border border-transparent hover:bg-accent-soft hover:border-accent/30 font-semibold',
  danger:
    'bg-danger-soft text-danger border border-danger/40 hover:border-danger hover:bg-danger/12',
}

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-[7px] gap-1.5',
  md: 'h-9 px-4 text-sm rounded-[8px] gap-2',
  lg: 'h-11 px-6 text-base rounded-[9px] gap-2.5',
}

export function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  full = false,
  disabled,
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cx(
        'inline-flex items-center justify-center font-semibold select-none whitespace-nowrap',
        'transition-colors duration-150 cursor-pointer',
        'disabled:opacity-45 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        full && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={size === 'lg' ? 16 : 13} />}
      {children}
    </Tag>
  )
}
