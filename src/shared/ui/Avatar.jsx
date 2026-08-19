import { cx } from '../lib/cx'

export function Avatar({ name = '', src, size = 36, ring = false, className, title }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <span
      title={title || name}
      className={cx(
        'relative inline-grid place-items-center rounded-full overflow-hidden select-none shrink-0',
        'bg-gradient-to-br from-brand-blue to-brand-purple text-white font-semibold',
        ring && 'ring-2 ring-brand-light ring-offset-2 ring-offset-space',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : initials || '•'}
    </span>
  )
}

export function AvatarStack({ users = [], size = 30, max = 5, className }) {
  const shown = users.slice(0, max)
  const rest = users.length - shown.length
  return (
    <span className={cx('inline-flex items-center', className)}>
      {shown.map((u, i) => (
        <span key={u.id ?? i} style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}>
          <Avatar name={u.name} src={u.src} size={size} className="border-2 border-space" />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="grid place-items-center rounded-full glass text-ink-2 font-mono border-2 border-space"
          style={{ width: size, height: size, marginLeft: -size * 0.3, fontSize: size * 0.34 }}
        >
          +{rest}
        </span>
      )}
    </span>
  )
}
