import { useMemo, useState } from 'react'
import { Button, Modal, Select } from '../../shared/ui'

/**
 * Занести клиента в архив. Своего списка клиентов у архива нет — берём
 * тот, что уже ведётся в CRM, ровно как просил заказчик.
 */
export function AddClientModal({ open, onClose, onSubmit, clients, alreadyInArchive }) {
  const [clientId, setClientId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Тех, кто уже в архиве, не предлагаем: повторное занесение всё равно
  // отклонится, а выбирать из списка с заведомо нерабочими строками неудобно.
  const available = useMemo(
    () => clients.filter((c) => !alreadyInArchive.has(c.id)),
    [clients, alreadyInArchive],
  )

  async function submit() {
    if (!clientId) return setError('Выберите клиента')
    setBusy(true)
    setError(null)
    const res = await onSubmit(clientId)
    setBusy(false)
    if (!res.ok) return setError(res.error)
    setClientId('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Клиент в архив"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} loading={busy} disabled={available.length === 0}>Занести</Button>
        </>
      }
    >
      {available.length === 0 ? (
        <p className="text-sm text-ink-2 leading-relaxed">
          Все клиенты из базы уже в архиве. Новый появится здесь, как только его заведут в CRM.
        </p>
      ) : (
        <Select
          label="Клиент"
          required
          placeholder="Выберите из базы клиентов"
          value={clientId}
          onChange={(e) => { setClientId(e.target.value); setError(null) }}
          error={error}
          options={available.map((c) => ({ value: c.id, label: c.name }))}
        />
      )}
    </Modal>
  )
}
