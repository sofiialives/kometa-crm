import { useEffect, useState } from 'react'
import { Modal, Button, Input } from '../../shared/ui'

/** Одна модалка на добавление и переименование — если передан client,
 * работает как редактирование. */
export function CreateClientModal({ open, client, onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const isEdit = Boolean(client)

  useEffect(() => {
    if (open) setName(client?.name || '')
    setError(null)
  }, [open, client])

  async function submit() {
    if (!name.trim()) return setError('Укажите имя клиента')

    setSaving(true)
    const res = isEdit ? await onSubmit(client.id, name.trim()) : await onSubmit(name.trim())
    setSaving(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось сохранить')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Переименовать клиента' : 'Новый клиент'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={saving} onClick={submit}>{isEdit ? 'Сохранить' : 'Добавить'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Имя клиента"
          required
          autoFocus
          placeholder="Например: ХочуПлачу"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null) }}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
