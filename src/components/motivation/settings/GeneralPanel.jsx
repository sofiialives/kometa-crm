import { useEffect, useState } from 'react'
import { Button, Card, Checkbox, DatePicker, Input } from '../../../shared/ui'
import { todayKey } from '../../../utils/calls'
import { dayMonth, nextMonthStartKey } from '../../../utils/motivation'

/**
 * Общие параметры: лимит штрафа за просрочку на одну задачу, потолок
 * баллов за личные задачи в день, уведомления о пополнении банка и баллах
 * и включение автобаллов за задачи.
 *
 * Автобаллы включаются с даты, а не сразу: запуск договорились делать с
 * первого числа, и задачи, просроченные до этой даты, не штрафуются.
 */
export function GeneralPanel({ general, onSave }) {
  const [form, setForm] = useState(general)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  // Сбрасываем ввод, только если с сервера пришло другое содержимое. Иначе
  // любое сохранение в соседнем блоке (оно перезапрашивает все настройки)
  // стирало бы то, что здесь набрано, но ещё не сохранено.
  const serverKey = JSON.stringify(general)
  useEffect(() => { setForm(general) }, [serverKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const num = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value.replace(/\D/g, '').slice(0, 3) }))

  async function save() {
    // Пустое поле — не ноль: иначе стёртый лимит молча отключил бы штрафы.
    for (const [key, label] of [['overduePenaltyCap', 'Лимит штрафа'], ['personalTaskDailyCap', 'Потолок за личные задачи']]) {
      const raw = String(form[key] ?? '').trim()
      if (!raw || Number(raw) > 100) {
        setMessage({ ok: false, text: `${label}: целое число от 0 до 100` })
        return
      }
    }
    const limit = Number(String(form.personalTaskDailyLimit ?? '').trim())
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      setMessage({ ok: false, text: 'Личных задач в день: целое число от 1 до 50' })
      return
    }
    // Задним числом не включаем: иначе по уже прошедшим ночам разом легли
    // бы штрафы. Уже сохранённую дату не трогаем — она могла давно пройти.
    if (form.autoTasksFrom && form.autoTasksFrom !== general.autoTasksFrom && form.autoTasksFrom < todayKey()) {
      setMessage({ ok: false, text: 'Автобаллы включаются не раньше сегодняшнего дня' })
      return
    }
    if (form.checkinFrom && form.checkinFrom !== general.checkinFrom && form.checkinFrom < todayKey()) {
      setMessage({ ok: false, text: 'Чек-ины включаются не раньше сегодняшнего дня' })
      return
    }
    setBusy(true)
    const res = await onSave({
      overduePenaltyCap: Number(form.overduePenaltyCap || 0),
      personalTaskDailyCap: Number(form.personalTaskDailyCap || 0),
      notifyBank: Boolean(form.notifyBank),
      notifyPoints: Boolean(form.notifyPoints),
      autoTasksFrom: form.autoTasksFrom || null,
      checkinFrom: form.checkinFrom || null,
      personalTaskDailyLimit: limit,
    })
    setBusy(false)
    setMessage(res.ok ? { ok: true, text: 'Сохранено' } : { ok: false, text: res.error })
  }

  return (
    <Card className="flex flex-col gap-4">
      <p className="caption">Общие параметры</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Лимит штрафа за просрочку одной задачи"
          inputMode="numeric"
          value={String(form.overduePenaltyCap ?? '')}
          onChange={num('overduePenaltyCap')}
          hint="Сколько баллов максимум снимается за одну задачу, сколько бы дней она ни висела"
        />
        <Input
          label="Потолок баллов за личные задачи в день"
          inputMode="numeric"
          value={String(form.personalTaskDailyCap ?? '')}
          onChange={num('personalTaskDailyCap')}
          hint="Личные задачи человек ставит себе сам — без потолка ими можно было бы набрать всю шкалу"
        />
        <Input
          label="Личных задач в день, не больше"
          inputMode="numeric"
          value={String(form.personalTaskDailyLimit ?? '')}
          onChange={num('personalTaskDailyLimit')}
          hint="Больше задач в «Задачах» на день поставить нельзя: десяток задач по одному слову не пройдёт"
        />
      </div>
      <AutoTasks
        value={form.autoTasksFrom || null}
        dirty={(form.autoTasksFrom || null) !== (general.autoTasksFrom || null)}
        onChange={(autoTasksFrom) => { setMessage(null); setForm((f) => ({ ...f, autoTasksFrom })) }}
      />
      <Checkins
        value={form.checkinFrom || null}
        dirty={(form.checkinFrom || null) !== (general.checkinFrom || null)}
        onChange={(checkinFrom) => { setMessage(null); setForm((f) => ({ ...f, checkinFrom })) }}
      />
      <div className="flex flex-col gap-2">
        <Checkbox label="Сообщать сотруднику о пополнении банка" checked={Boolean(form.notifyBank)} onChange={(e) => setForm((f) => ({ ...f, notifyBank: e.target.checked }))} />
        <Checkbox label="Сообщать сотруднику о начислении и списании баллов" checked={Boolean(form.notifyPoints)} onChange={(e) => setForm((f) => ({ ...f, notifyPoints: e.target.checked }))} />
        <p className="text-xs text-ink-3">Сообщения приходят от бота в телеграм с 9:00 до 21:00 — ночные копятся до утра. Во вкладке новое тоже подсвечивается.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" loading={busy} onClick={save}>Сохранить</Button>
        {message && <span className={message.ok ? 'text-sm text-ok' : 'text-sm text-danger'}>{message.text}</span>}
      </div>
    </Card>
  )
}

/**
 * Внезапные чек-ины бота: каждый третий рабочий день в случайное время с
 * 11:00 до 18:15 бот спрашивает всех «чем занят?», молчунам — −3. Включаются
 * с даты, как и автобаллы, чтобы штрафы не пошли сразу после выкладки.
 */
function Checkins({ value, dirty, onChange }) {
  const today = todayKey()
  const on = Boolean(value)
  const when = value <= today ? `С ${dayMonth(value)}` : `Начиная с ${dayMonth(value)}`
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line p-3">
      <Checkbox
        label="Внезапные чек-ины в телеграме"
        checked={on}
        onChange={(e) => onChange(e.target.checked ? nextMonthStartKey(today) : null)}
      />
      {on && (
        <div className="grid gap-3 sm:grid-cols-2">
          <DatePicker label="С какого дня" value={value} onChange={onChange} today={today} min={today} required />
        </div>
      )}
      <p className="text-xs text-ink-3 leading-relaxed">
        {on
          ? `${when} каждый третий рабочий день в случайное время с 11:00 до 18:15 бот спрашивает всех, чем они заняты. 45 минут на ответ; кто промолчал и не предупредил, что отошёл, — событие «Не ответил на внезапный чек-ин» из профиля. Вам — отчёт, кто чем занят.`
          : 'Выключены: бот не спрашивает и не штрафует.'}
        {dirty && <span className="text-warn"> Не сохранено — нажмите «Сохранить».</span>}
      </p>
    </div>
  )
}

function AutoTasks({ value, dirty, onChange }) {
  const today = todayKey()
  const on = Boolean(value)
  const when = value <= today ? `С ${dayMonth(value)}` : `Начиная с ${dayMonth(value)}`
  // Сразу баллы или на решение — задаётся у каждого правила в условиях отдела.
  const status = on
    ? `${when} баллы за задачи считаются по правилам в условиях отделов: сразу или вам на решение, как задано у правила. Задачи, просроченные раньше, не штрафуются.`
    : 'Выключены: закрытые и просроченные задачи на баллы не влияют.'

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line p-3">
      <Checkbox
        label="Баллы за задачи: в срок плюс, просрочка минус"
        checked={on}
        onChange={(e) => onChange(e.target.checked ? nextMonthStartKey(today) : null)}
      />
      {on && (
        <div className="grid gap-3 sm:grid-cols-2">
          <DatePicker
            label="С какого дня"
            value={value}
            onChange={onChange}
            today={today}
            min={today}
            required
          />
        </div>
      )}
      <p className="text-xs text-ink-3 leading-relaxed">
        {status}
        {dirty && <span className="text-warn"> Не сохранено, нажмите «Сохранить».</span>}
      </p>
    </div>
  )
}
