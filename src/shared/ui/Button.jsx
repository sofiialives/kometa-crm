import { cx } from '../lib/cx'
import { Spinner } from './Spinner'

const variants = {
  primary:
    'bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-[0_6px_24px_rgba(133,76,255,0.35)] hover:shadow-[0_8px_32px_rgba(133,76,255,0.5)] hover:-translate-y-px',
  secondary:
    'glass text-ink hover:border-brand-purple/50 hover:-translate-y-px',
  outline:
    'bg-transparent border border-white/25 text-ink-2 hover:text-ink hover:border-brand-purple/60',
  ghost:
    'bg-transparent text-ink-3 hover:text-ink hover:bg-white/5',
  danger:
    'bg-danger/10 border border-danger/40 text-danger hover:bg-danger/20',
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
