import { AddAction, Input, Select } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { money, monthOptions } from '../../utils/board'

export const newExpense = () => ({ key: Math.random().toString(36).slice(2), title: '', amount: '' })
export const newService = (month) => ({
  key: Math.random().toString(36).slice(2),
  title: '', month, revenue: '', expenses: [],
})

export const num = (v) => (v === '' ? 0 : Number(String(v).replace(',', '.')))

/** Сумма расходов и прибыль по одной услуге — подсказка, пока человек печатает. */
export function serviceProfit(service) {
  const spent = service.expenses.reduce((n, e) => n + (Number.isFinite(num(e.amount)) ? num(e.amount) : 0), 0)
  return num(service.revenue) - spent
}

/**
 * Поля одной услуги: что делали, за какой месяц, выручка и строки расходов.
 *
 * Один компонент на два места — форму новой услуги и форму нового клиента,
 * где услуги заводятся сразу. Заказчик так и описывал: «нажали на кнопочку
 * новый клиент, у нас прямо большой лист, который нужно заполнить». Держать
 * два одинаковых набора полей значило бы однажды поправить только один.
 */
export function ServiceFields({ value, onChange, onRemove, compact }) {
  const set = (patch) => onChange({ ...value, ...patch })
  const patchExpense = (key, patch) =>
    set({ expenses: value.expenses.map((e) => (e.key === key ? { ...e, ...patch } : e)) })

  const profit = serviceProfit(value)

  return (
    <div className={cx('flex flex-col gap-4', compact && 'rounded-card border border-line p-4')}>
      <div className="flex items-start gap-2">
        <Input
          className="flex-1"
          label="Что делали"
          required
          value={value.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Например: SMM — ведение телеграм-канала"
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Убрать услугу"
            className="mt-7 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="За какой месяц"
          required
          value={value.month}
          onChange={(e) => set({ month: e.target.value })}
          options={monthOptions([], value.month)}
          hint="Суммы относятся к этому месяцу"
        />
        <Input
          label="Выручка, $"
          required
          inputMode="decimal"
          value={value.revenue}
          onChange={(e) => set({ revenue: e.target.value })}
          placeholder="800"
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="caption">Расходы по этой услуге</p>

        {value.expenses.length === 0 && (
          <p className="text-xs text-ink-3">Расходов нет — вся выручка идёт в прибыль.</p>
        )}

        {value.expenses.map((e) => (
          <div key={e.key} className="flex items-start gap-2">
            <Input
              className="flex-1"
              size="sm"
              value={e.title}
              onChange={(ev) => patchExpense(e.key, { title: ev.target.value })}
              placeholder="На что: копирайтер"
            />
            <Input
              className="w-28 shrink-0"
              size="sm"
              inputMode="decimal"
              value={e.amount}
              onChange={(ev) => patchExpense(e.key, { amount: ev.target.value })}
              placeholder="200"
            />
            <button
              type="button"
              onClick={() => set({ expenses: value.expenses.filter((x) => x.key !== e.key) })}
              title="Убрать расход"
              className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        <AddAction onClick={() => set({ expenses: [...value.expenses, newExpense()] })}>
          Добавить расход
        </AddAction>
      </div>

      {/* Подсказка, пока печатают. Настоящую прибыль считает сервер и
          возвращает обратно — арифметика живёт в одном месте. */}
      <div className="flex items-baseline justify-between gap-3 rounded-[10px] border border-line px-4 py-2.5">
        <span className="caption">Прибыль по услуге</span>
        <span className={cx('text-base font-semibold tabular-nums', profit < 0 ? 'text-danger' : 'text-ok')}>
          {money(Math.round(profit * 100))}
        </span>
      </div>
    </div>
  )
}

/** Общая проверка полей услуги — одна на обе формы. */
export function validateService(s) {
  if (!s.title.trim()) return 'Укажите название услуги'
  if (s.revenue === '' || !Number.isFinite(num(s.revenue))) return `Выручка по «${s.title.trim()}» не число`
  for (const e of s.expenses) {
    if (!e.title.trim()) return 'У каждого расхода должно быть название — на что он'
    if (e.amount === '' || !Number.isFinite(num(e.amount))) return `Сумма расхода «${e.title}» не число`
  }
  return null
}

/** Приводит поля формы к тому, что ждёт сервер. */
export const serviceToPayload = (s) => ({
  title: s.title.trim(),
  month: s.month,
  revenue: num(s.revenue),
  expenses: s.expenses.map((e) => ({ title: e.title.trim(), amount: num(e.amount) })),
})
