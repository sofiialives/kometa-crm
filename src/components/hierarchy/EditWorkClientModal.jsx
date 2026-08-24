import { useEffect, useState } from 'react'
import { Modal, Button, Select } from '../../shared/ui'

export function EditWorkClientModal({ work, clients, onClose, onSubmit }) {
  const [clientId, setClientId] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (work) { setClientId(work.client?.id || ''); setError(null) }
  }, [work])

  async function submit() {
    if (!clientId) return setError('Выберите клиента')

    setSaving(true)
    const res = await onSubmit(work.id, clientId)
    setSaving(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось сохранить')
  }

  return (
    <Modal
      open={Boolean(work)}
      onClose={onClose}
      title="Клиент этой работы"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={saving} onClick={submit}>Сохранить</Button>
        </>
      }
    >
      {!work ? null : (
        <div className="flex flex-col gap-4">
          <p className="caption">{work.title}</p>
          <Select
            label="Клиент"
            required
            placeholder="Выберите клиента"
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setError(null) }}
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
