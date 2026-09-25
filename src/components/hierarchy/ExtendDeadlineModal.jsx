import { useEffect, useState } from 'react'
import { Modal, Button, DatePicker, TimePicker } from '../../shared/ui'
import { buildDeadlineMsk, splitDeadlineMsk } from '../../utils/tasks'
import { todayKey } from '../../utils/calls'

export function ExtendDeadlineModal({ task, onClose, onSubmit }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!task) return
    const split = splitDeadlineMsk(task.deadline)
    setDate(split.date)
    setTime(split.time)
    setError(null)
  }, [task])

  async function submit() {
    let deadline
    try {
      deadline = buildDeadlineMsk(date, time)
    } catch {
      return setError('Укажите дату и время')
    }

    setSaving(true)
    const res = await onSubmit(task.id, deadline)
    setSaving(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось продлить срок')
  }

  return (
    <Modal
      open={Boolean(task)}
      onClose={onClose}
      title="Продлить срок"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={saving} onClick={submit}>Сохранить</Button>
        </>
      }
    >
      {!task ? null : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-2">
            Задача <span className="font-medium text-ink">{task.title}</span>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Дата"
              required
              value={date}
              onChange={(v) => { setDate(v); setError(null) }}
              today={todayKey()}
            />
            <TimePicker
              label="Время, по Москве"
              required
              value={time}
              onChange={(v) => { setTime(v); setError(null) }}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
