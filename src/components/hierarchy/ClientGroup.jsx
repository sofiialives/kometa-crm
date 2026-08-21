import { useState } from 'react'
import { cx } from '../../shared/lib/cx'
import { withPlural } from '../../shared/lib/plural'

export function ClientGroup({ clientName, works, taskCounts, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const totalTasks = taskCounts.reduce((sum, n) => sum + n, 0)

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cx(
          'flex items-center justify-between gap-3 rounded-2xl glass px-4 py-3 text-left transition-colors cursor-pointer',
          open ? 'border-brand-purple/40' : 'hover:border-brand-purple/25',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-purple text-sm font-bold text-white">
            {clientName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight">{clientName}</p>
            <p className="mono-caption">
              {withPlural(works.length, 'работа', 'работы', 'работ')}
              {totalTasks > 0 && ` · ${withPlural(totalTasks, 'задача', 'задачи', 'задач')}`}
            </p>
          </div>
        </div>

        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className={cx('shrink-0 text-ink-3 transition-transform duration-150', open && 'rotate-180')}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && <div className="flex flex-col gap-3 pl-1">{children}</div>}
    </div>
  )
}
