import { useEffect, useMemo, useState } from 'react'
import { Modal, Button, Input, Select } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'

export function CreateWorkModal({ open, onClose, departments, clients, defaultDepartmentId, onSubmit }) {
  const [clientName, setClientName] = useState('')
  const [title, setTitle] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setClientName('')
    setTitle('')
    setDepartmentId(defaultDepartmentId || departments[0]?.id || '')
    setError(null)
  }, [open, departments, defaultDepartmentId])

  const suggestions = useMemo(() => {
    const query = clientName.trim().toLowerCase()
    if (!query) return clients.slice(0, 6)
    return clients.filter((c) => c.toLowerCase().includes(query) && c.toLowerCase() !== query).slice(0, 6)
  }, [clients, clientName])

  async function submit() {
    if (!clientName.trim()) return setError('Укажите клиента')
    if (!title.trim()) return setError('Укажите название работы')
    if (!departmentId) return setError('Выберите отдел')

    setSaving(true)
    const res = await onSubmit({
      clientName: clientName.trim(),
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
          <Button loading={saving} disabled={departments.length === 0} onClick={submit}>Создать</Button>
        </>
      }
    >
      {departments.length === 0 ? (
        <p className="text-sm text-ink-2">Сначала нужен хотя бы один отдел.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Input
              label="Клиент"
              required
              placeholder="Начните вводить название"
              value={clientName}
              onChange={(e) => { setClientName(e.target.value); setError(null) }}
              hint="Можно выбрать из тех, с кем уже работали, или вписать нового"
            />
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setClientName(c)}
                    className={cx(
                      'rounded-full glass px-3 py-1.5 text-sm text-ink-2 transition-colors cursor-pointer',
                      'hover:border-brand-purple/50 hover:text-ink',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

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
