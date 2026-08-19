import { cx } from '../lib/cx'

const pads = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }

export function Card({ hover = false, pad = 'md', className, children, ...props }) {
  return (
    <div
      className={cx(
        'glass rounded-card',
        hover && 'transition-all duration-200 hover:-translate-y-1 hover:border-brand-purple/40 hover:shadow-[0_14px_40px_rgba(0,0,0,0.35)]',
        pads[pad],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
