import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Modal, PriorityPicker, Textarea, TimePicker } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import {
  buildDeadlineMsk,
  deadlineDayOptions,
  defaultMskTimeValue,
  isPastMsk,
  mskDateValueIn,
} from '../../utils/tasks'

export function CreateTaskModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(mskDateValueIn)
  const [time, setTime] = useState(defaultMskTimeValue)
  const [priority, setPriority] = useState('medium')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Дни считаются от текущего момента, поэтому пересчитываем их при каждом
  // открытии: вкладку могли не закрывать с вечера, и «сегодня» уже другое.
  const days = useMemo(() => deadlineDayOptions(), [open])

  // Состояние отстаёт на кадр: список дней пересчитывается уже в рендере, а
  // сброс даты — в эффекте после него. Без запасного варианта подсказка успеет
  // моргнуть пустотой у того, кто не закрывал вкладку с вечера.
  const chosen = days.find((d) => d.value === date) || days[0]
  const past = isPastMsk(chosen.value, time)
  const hint = past
    ? 'Это время уже прошло — задача сразу получит пометку «срок прошёл»'
    : `Срок: ${chosen.label.toLowerCase()}, ${chosen.full}, до ${time}`

  useEffect(() => {
    if (open) {
      setDate(mskDateValueIn())
      setTime(defaultMskTimeValue())
    }
  }, [open])

  function reset() {
    setTitle(''); setDescription(''); setDate(mskDateValueIn()); setTime(defaultMskTimeValue()); setPriority('medium'); setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Ровно сценарий, ради которого всё затевалось: окно открыли вечером, а
    // отправили уже за полночь. Выбранный день к этому моменту вчерашний —
    // задача родилась бы просроченной, поэтому подтягиваем к сегодняшнему.
    const today = mskDateValueIn()
    const day = chosen.value < today ? today : chosen.value

    let deadline
    try {
      deadline = buildDeadlineMsk(day, time)
    } catch {
      setError('Укажите корректный срок (день, часы и минуты)')
      return
    }

    setLoading(true)
    const res = await onSubmit({ title, description, deadline, priority })
    setLoading(false)
    if (res.ok) { reset(); onClose() } else { setError(res.error) }
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Задача на день" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Название"
          placeholder="Например: ревью пулл-реквеста"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
        <Textarea
          label="Описание"
          placeholder="Необязательно: детали, ссылки, контекст"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="flex flex-col gap-2">
          <span className="caption select-none">День</span>
          <div className="flex flex-wrap gap-2">
            {days.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDate(d.value)}
                className={cx(
                  'rounded-[8px] border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  chosen.value === d.value
                    ? 'border-accent bg-accent text-on-accent'
                    : 'border-line-2 text-ink-2 hover:border-accent hover:text-ink',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <TimePicker
          label="Время (МСК)"
          hint={hint}
          value={time}
          onChange={setTime}
          required
        />
        <PriorityPicker value={priority} onChange={setPriority} />
        {error && <p className="text-xs text-danger -mt-2">{error}</p>}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={() => { reset(); onClose() }}>Отмена</Button>
          <Button type="submit" loading={loading}>Создать</Button>
        </div>
      </form>
    </Modal>
  )
}
