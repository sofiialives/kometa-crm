import { cx } from '../lib/cx'
import { Spinner } from './Spinner'

const variants = {
  primary:
    'bg-gradient-to-br from-brand-blue to-brand-purple text-white border border-transparent shadow-[0_6px_24px_rgba(133,76,255,0.35)] hover:shadow-[0_10px_34px_rgba(133,76,255,0.55)] hover:-translate-y-px active:translate-y-0',
  secondary:
    'bg-surface-3 border border-line-strong text-ink hover:border-accent hover:bg-space-2 hover:-translate-y-px active:translate-y-0',
  outline:
    'bg-transparent border border-line-strong text-ink-2 hover:text-ink hover:border-accent hover:bg-surface-3',
  ghost:
    'bg-transparent border border-transparent text-ink-2 hover:text-ink hover:bg-surface-3 hover:border-line',
  danger:
    'bg-danger/12 border border-danger/55 text-danger hover:bg-danger/22 hover:border-danger',
}

const sizes = {
  sm: 'h-8 px-3.5 text-[13px] rounded-[10px] gap-1.5',
  md: 'h-10 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-7 text-[15px] rounded-[14px] gap-2.5',
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
        'inline-flex items-center justify-center font-semibold select-none',
        'transition-all duration-200 cursor-pointer',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        full && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={size === 'lg' ? 18 : 14} />}
      {children}
    </Tag>
  )
}
