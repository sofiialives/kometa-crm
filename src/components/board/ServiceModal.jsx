import { useEffect, useState } from 'react'
import { AddAction, Button, Input, Modal, Select } from '../../shared/ui'
import { money, monthKey, recentMonths } from '../../utils/board'

const emptyExpense = () => ({ key: Math.random().toString(36).slice(2), title: '', amount: '' })

/**
 * Услуга за конкретный месяц: выручка и строки расходов под ней.
 *
 * Прибыль внизу показываем на лету, пока человек печатает, — но это только
 * подсказка. Настоящую считает сервер и отдаёт обратно: две арифметики в
 * двух местах однажды разойдутся, и никто не поймёт, какая права.
 */
export function ServiceModal({ open, onClose, onSubmit, service, defaultMonth }) {
  const editing = Boolean(service)
  const [title, setTitle] = useState('')
  const [month, setMonth] = useState('')
  const [revenue, setRevenue] = useState('')
  const [expenses, setExpenses] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setTitle(service?.title || '')
    setMonth(service ? monthKey(service.month) : defaultMonth || monthKey())
    setRevenue(service ? String(service.revenueCents / 100) : '')
    setExpenses(
      service?.expenses?.length
        ? service.expenses.map((e) => ({ key: e.id, title: e.title, amount: String(e.amountCents / 100) }))
        : [],
    )
    setError(null)
  }, [open, service, defaultMonth])

  const num = (v) => (v === '' ? 0 : Number(String(v).replace(',', '.')))
  const spent = expenses.reduce((n, e) => n + (Number.isFinite(num(e.amount)) ? num(e.amount) : 0), 0)
  const profit = num(revenue) - spent

  function patchExpense(key, patch) {
    setExpenses((list) => list.map((e) => (e.key === key ? { ...e, ...patch } : e)))
  }

  async function submit() {
    if (!title.trim()) return setError('Укажите название услуги')
    if (revenue === '' || !Number.isFinite(num(revenue))) return setError('Укажите выручку числом')
    for (const e of expenses) {
      if (!e.title.trim()) return setError('У каждого расхода должно быть название — на что он')
      if (e.amount === '' || !Number.isFinite(num(e.amount))) return setError(`Сумма расхода «${e.title}» не число`)
    }

    setBusy(true)
    setError(null)
    const res = await onSubmit({
      title: title.trim(),
      month,
      revenue: num(revenue),
      expenses: expenses.map((e) => ({ title: e.title.trim(), amount: num(e.amount) })),
    })
    setBusy(false)
    if (!res.ok) return setError(res.error)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Услуга' : 'Новая услуга'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} loading={busy}>{editing ? 'Сохранить' : 'Добавить'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Что делали"
          required
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(null) }}
          placeholder="Например: SMM — ведение телеграм-канала"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="За какой месяц"
            required
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            options={recentMonths()}
            hint="Суммы относятся к этому месяцу"
          />
          <Input
            label="Выручка, $"
            required
            inputMode="decimal"
            value={revenue}
            onChange={(e) => { setRevenue(e.target.value); setError(null) }}
            placeholder="800"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="caption">Расходы по этой услуге</p>

          {expenses.length === 0 && (
            <p className="text-xs text-ink-3">Расходов нет — вся выручка идёт в прибыль.</p>
          )}

          {expenses.map((e) => (
            <div key={e.key} className="flex items-start gap-2">
              <Input
                className="flex-1"
                size="sm"
                value={e.title}
                onChange={(ev) => { patchExpense(e.key, { title: ev.target.value }); setError(null) }}
                placeholder="На что: копирайтер"
              />
              <Input
                className="w-28 shrink-0"
                size="sm"
                inputMode="decimal"
                value={e.amount}
                onChange={(ev) => { patchExpense(e.key, { amount: ev.target.value }); setError(null) }}
                placeholder="200"
              />
              <button
                type="button"
                onClick={() => setExpenses((l) => l.filter((x) => x.key !== e.key))}
                title="Убрать расход"
                className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          <AddAction onClick={() => setExpenses((l) => [...l, emptyExpense()])}>Добавить расход</AddAction>
        </div>

        <div className="flex items-baseline justify-between gap-3 rounded-card border border-line px-4 py-3">
          <span className="caption">Прибыль по услуге</span>
          <span className={profit < 0 ? 'text-lg font-semibold tabular-nums text-danger' : 'text-lg font-semibold tabular-nums text-ok'}>
            {money(Math.round(profit * 100))}
          </span>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
