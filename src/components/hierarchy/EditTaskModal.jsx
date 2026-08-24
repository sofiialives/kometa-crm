import { useEffect, useState } from 'react'
import { Modal, Button, Input, Textarea, PriorityPicker } from '../../shared/ui'

export function EditTaskModal({ task, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!task) return
    setTitle(task.title || '')
    setDescription(task.description || '')
    setPriority(task.priority || 'medium')
    setError(null)
  }, [task])

  async function submit() {
    if (!title.trim()) return setError('Укажите название')

    setSaving(true)
    const res = await onSubmit(task.id, { title: title.trim(), description: description.trim(), priority })
    setSaving(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось сохранить')
  }

  return (
    <Modal
      open={Boolean(task)}
      onClose={onClose}
      title="Изменить задачу"
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
          <Input
            label="Название"
            required
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(null) }}
          />
          <Textarea
            label="Описание"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <PriorityPicker value={priority} onChange={setPriority} />
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
