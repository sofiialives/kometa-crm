import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Field, controlClasses, useFieldId } from './Field'
import { useAnchoredPanel } from './useAnchoredPanel'
import { cx } from '../lib/cx'

const pad = (n) => String(n).padStart(2, '0')

// Часы, в которые реально назначают звонки и сроки. Круглые сутки списком —
// это девяносто шесть строк, по которым приходится долго крутить.
const QUICK = []
for (let h = 8; h <= 21; h += 1) for (const m of [0, 15, 30, 45]) QUICK.push(`${pad(h)}:${pad(m)}`)

/** Из набранного оставляем цифры и собираем ЧЧ:ММ. */
function format(raw) {
  const digits = String(raw).replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

/** Приводим к настоящему времени: 9:7 → 09:07, 25:99 → 23:59. */
function normalize(raw) {
  const digits = String(raw).replace(/\D/g, '')
  if (!digits) return ''
  const h = Math.min(23, Number(digits.slice(0, 2).padEnd(2, '0')))
  const m = Math.min(59, Number(digits.slice(2, 4).padEnd(2, '0')))
  return `${pad(h)}:${pad(m)}`
}

/**
 * Родной <input type="time"> открывает часы операционной системы: на
 * телефоне это колесо, на макбуке — свои стрелки и своё оформление.
 *
 * Здесь поле остаётся обычным текстовым — набрать «1845» по-прежнему самый
 * быстрый способ, и отнимать его было бы шагом назад. Рядом кнопка со
 * списком ходовых времён для тех, кому проще выбрать.
 */
export function TimePicker({ label, hint, error, required, disabled, value, onChange, id: propId, className }) {
  const id = useFieldId(propId)
  const { open, setOpen, pos, boxRef, panelRef } = useAnchoredPanel({ height: 240 })
  const [raw, setRaw] = useState(value || '')

  // Значение могли поменять снаружи — например, открыли карточку другого
  // звонка в том же окне.
  useEffect(() => { setRaw(value || '') }, [value])

  function type(next) {
    const shown = format(next)
    setRaw(shown)
    // Наружу отдаём только готовое время: полуфабрикат «18:4» сломал бы
    // сборку даты у вызывающего.
    const done = shown.length === 5 ? normalize(shown) : ''
    onChange?.(done)
  }

  function blur() {
    const fixed = normalize(raw)
    setRaw(fixed)
    onChange?.(fixed)
  }

  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={className}>
      <div className="relative" ref={boxRef}>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="18:45"
          disabled={disabled}
          value={raw}
          onChange={(e) => type(e.target.value)}
          onBlur={blur}
          className={cx(controlClasses({ error }), 'pr-11 tabular-nums')}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          aria-label="Выбрать время из списка"
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink cursor-pointer disabled:cursor-default"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>

        {open && !disabled && pos && createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width }}
            className="z-[60] panel rounded-card bg-panel p-1 animate-fade-in shadow-xl"
          >
            <div className="grid max-h-[224px] grid-cols-3 gap-0.5 overflow-y-auto">
              {QUICK.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setRaw(t); onChange?.(t); setOpen(false) }}
                  className={cx(
                    'rounded-[8px] px-2 py-1.5 text-sm tabular-nums transition-colors cursor-pointer',
                    t === value
                      ? 'bg-accent text-on-accent font-semibold'
                      : 'text-ink-2 hover:bg-panel-2 hover:text-ink',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
      </div>
    </Field>
  )
}
