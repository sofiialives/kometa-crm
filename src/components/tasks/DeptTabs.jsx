import { useEffect, useRef, useState } from 'react'
import { cx } from '../../shared/lib/cx'

export function DeptTabs({ departments, active, onSelect }) {
  const scrollRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  function updateArrows() {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    updateArrows()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', updateArrows)
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [departments])

  function scrollBy(delta) {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <div className="flex items-center gap-1.5 -mt-1">
      {canLeft && (
        <button
          onClick={() => scrollBy(-160)}
          className="shrink-0 grid place-items-center w-7 h-7 rounded-full panel text-ink-3 hover:text-ink transition-colors cursor-pointer"
          aria-label="Прокрутить влево"
        >
          <ChevronIcon left />
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {departments.map((d) => (
          <DeptTab key={d.id} active={active === d.id} onClick={() => onSelect(d.id)}>
            {d.name}
          </DeptTab>
        ))}
      </div>
      {canRight && (
        <button
          onClick={() => scrollBy(160)}
          className="shrink-0 grid place-items-center w-7 h-7 rounded-full panel text-ink-3 hover:text-ink transition-colors cursor-pointer"
          aria-label="Прокрутить вправо"
        >
          <ChevronIcon />
        </button>
      )}
    </div>
  )
}

function ChevronIcon({ left }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={left ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  )
}

function DeptTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
        active
          ? 'bg-accent text-white'
          : 'panel text-ink-3 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
