import { useEffect, useState } from 'react'
import { Modal, Button, Input, Textarea } from '../../shared/ui'
import { buildTodayDeadlineMsk, defaultMskTimeValue } from '../../utils/tasks'

export function AddTaskModal({ work, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [time, setTime] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!work) return
    setTitle('')
    setDescription('')
    setTime(defaultMskTimeValue())
    setError(null)
  }, [work])

  async function submit() {
    if (!title.trim()) return setError('Укажите название')

    let deadline
    try {
      deadline = buildTodayDeadlineMsk(time)
    } catch {
      return setError('Время в формате ЧЧ:ММ')
    }

    setSaving(true)
    const res = await onSubmit({ title: title.trim(), description: description.trim(), deadline, workId: work.id })
    setSaving(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось создать задачу')
  }

  return (
    <Modal
      open={Boolean(work)}
      onClose={onClose}
      title="Задача по работе"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={saving} onClick={submit}>Создать</Button>
        </>
      }
    >
      {!work ? null : (
        <div className="flex flex-col gap-4">
          <p className="mono-caption">{work.clientName} · {work.title}</p>

          <Input
            label="Название"
            required
            placeholder="Например: Собрать референсы"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(null) }}
          />

          <Textarea
            label="Описание"
            rows={3}
            placeholder="Кратко опишите задачу"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            label="Срок сегодня, по Москве"
            required
            type="time"
            value={time}
            onChange={(e) => { setTime(e.target.value); setError(null) }}
          />

          {error && <p className="text-[13px] text-danger">{error}</p>}

          <p className="text-[12.5px] leading-relaxed text-ink-3">
            Задача создаётся на вас. Назначать задачи другим сотрудникам API пока не умеет.
          </p>
        </div>
      )}
    </Modal>
  )
}
