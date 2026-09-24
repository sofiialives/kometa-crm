import { useEffect, useState } from 'react'
import { Button, Input, Modal, Select } from '../../shared/ui'

/**
 * Услуга под клиентом. Название пишут руками каждый раз — так решил
 * заказчик, зная, что «Таргет» и «таргетинг» станут разными строками.
 *
 * Отдел выбирается только при создании: перенос услуги в другой отдел —
 * это смена видимости всех её отчётов разом, и делать это мимоходом
 * через правку названия не стоит.
 */
export function ServiceModal({ open, onClose, onSubmit, service, departments, defaultDepartmentId }) {
  const editing = Boolean(service)
  const [title, setTitle] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setTitle(service?.title || '')
    setDepartmentId(service?.departmentId || defaultDepartmentId || '')
    setError(null)
  }, [open, service, defaultDepartmentId])

  async function submit() {
    const clean = title.trim()
    if (!clean) return setError('Название услуги обязательно')
    if (!editing && !departmentId) return setError('Выберите отдел')

    setBusy(true)
    setError(null)
    const res = await onSubmit({ title: clean, departmentId })
    setBusy(false)
    if (!res.ok) return setError(res.error)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Название услуги' : 'Новая услуга'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} loading={busy}>{editing ? 'Сохранить' : 'Завести'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Чем занимались"
          required
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(null) }}
          placeholder="Например: ведение соцсетей"
          error={error}
        />
        {!editing && (
          <Select
            label="Отдел"
            required
            placeholder="Выберите отдел"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            hint="Отчёты по этой услуге увидят сотрудники выбранного отдела"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />
        )}
      </div>
    </Modal>
  )
}
