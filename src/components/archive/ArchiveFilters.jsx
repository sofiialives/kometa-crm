import { useState } from 'react'
import { Button, DatePicker, Input, Select } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'

const FIELDS = ['clientId', 'authorId', 'from', 'to']

/**
 * Панель фильтров, общая для обоих режимов вкладки.
 *
 * Значения живут в адресной строке, а не только в памяти: отфильтрованную
 * выборку можно скинуть ссылкой коллеге — «вот все отчёты по Ozon» — и он
 * увидит ровно то же самое.
 *
 * Свёрнута по умолчанию. Четыре поля в развёрнутом виде занимали на
 * телефоне весь первый экран, и до самих отчётов приходилось листать —
 * а нужны они далеко не каждый раз. Строка поиска остаётся на виду
 * всегда: с неё начинают чаще всего.
 */
export function ArchiveFilters({ value, onChange, clients, authors, onReset }) {
  const active = FIELDS.filter((k) => value[k]).length
  const [open, setOpen] = useState(active > 0)
  const set = (patch) => onChange({ ...value, ...patch })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          className="flex-1"
          value={value.q || ''}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="Поиск по названию, услуге, клиенту и тексту внутри отчётов"
          aria-label="Поиск по архиву"
        />
        <button
          onClick={() => setOpen((v) => !v)}
          className={cx(
            'flex h-11 shrink-0 items-center justify-center gap-2 rounded-[--radius-field] border px-4 text-sm font-medium transition-colors cursor-pointer',
            active > 0 || open
              ? 'border-accent/40 bg-accent-soft text-accent'
              : 'border-line-2 text-ink-2 hover:text-ink hover:bg-panel-2',
          )}
          aria-expanded={open}
        >
          Фильтры
          {active > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-semibold text-on-accent">
              {active}
            </span>
          )}
          <svg
            className={cx('transition-transform', open && 'rotate-180')}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Клиент"
              placeholder="Любой"
              value={value.clientId || ''}
              onChange={(e) => set({ clientId: e.target.value })}
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Select
              label="Кто заливал"
              placeholder="Любой"
              value={value.authorId || ''}
              onChange={(e) => set({ authorId: e.target.value })}
              options={authors.map((a) => ({ value: a.id, label: a.name }))}
            />
            <DatePicker label="Работа с" value={value.from || ''} onChange={(v) => set({ from: v })} />
            <DatePicker label="по" value={value.to || ''} onChange={(v) => set({ to: v })} />
          </div>

          {(active > 0 || value.q) && (
            <div>
              <Button variant="ghost" size="sm" onClick={onReset}>Сбросить фильтры</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
