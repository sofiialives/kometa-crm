import { useEffect, useState } from 'react'
import { Button, Input, Modal, Textarea, PriorityPicker } from '../../shared/ui'
import { buildTodayDeadlineMsk, defaultMskTimeValue } from '../../utils/tasks'

export function CreateTaskModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [time, setTime] = useState(defaultMskTimeValue)
  const [priority, setPriority] = useState('medium')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setTime(defaultMskTimeValue())
  }, [open])

  function reset() {
    setTitle(''); setDescription(''); setTime(defaultMskTimeValue()); setPriority('medium'); setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    let deadline
    try {
      deadline = buildTodayDeadlineMsk(time)
    } catch {
      setError('Укажите корректный срок (часы и минуты)')
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
        <Input
          type="time"
          label="Срок на сегодня (МСК)"
          hint="После этого времени задача пометится «срок прошёл»"
          value={time}
          onChange={(e) => setTime(e.target.value)}
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
