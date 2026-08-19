export function Pill({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple shadow-[0_0_8px_rgba(133,76,255,0.8)]" />
      <span className="mono-caption !text-ink-2">{children}</span>
    </span>
  )
}
