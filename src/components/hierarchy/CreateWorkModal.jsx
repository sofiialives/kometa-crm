import { useEffect, useState } from 'react'
import { Modal, Button, Input, Select } from '../../shared/ui'

export function CreateWorkModal({ open, onClose, departments, clients, defaultDepartmentId, onSubmit }) {
  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setClientId('')
    setTitle('')
    setDepartmentId(defaultDepartmentId || departments[0]?.id || '')
    setError(null)
  }, [open, departments, defaultDepartmentId])

  async function submit() {
    if (!clientId) return setError('Выберите клиента')
    if (!title.trim()) return setError('Укажите название работы')
    if (!departmentId) return setError('Выберите отдел')

    setSaving(true)
    const res = await onSubmit({
      clientId,
      title: title.trim(),
      departmentId,
      assignees: [],
    })
    setSaving(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось создать работу')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новая работа"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={saving} disabled={departments.length === 0 || clients.length === 0} onClick={submit}>Создать</Button>
        </>
      }
    >
      {departments.length === 0 ? (
        <p className="text-sm text-ink-2">Сначала нужен хотя бы один отдел.</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-ink-2">
          Клиентов пока нет — добавьте хотя бы одного в Админ-панели, прежде чем создавать работу.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <Select
            label="Клиент"
            required
            placeholder="Выберите клиента"
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setError(null) }}
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
          />

          <Input
            label="Название работы"
            required
            placeholder="Например: Цепляющая главная"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(null) }}
          />

          <Select
            label="Отдел"
            required
            value={departmentId}
            onChange={(e) => { setDepartmentId(e.target.value); setError(null) }}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
