import { useEffect, useMemo, useState } from 'react'
import { Button, DatePicker, Input, Modal, Select } from '../../shared/ui'
import { dayKey } from '../../utils/board'

/**
 * Занести клиента на доску. Список клиентов в CRM один на всё — и в
 * Иерархии, и в Архиве, и здесь. Поэтому выбираем существующего, а нового
 * можно завести тут же, не уходя в справочник.
 */
export function AddClientModal({ open, onClose, onSubmit, clients, alreadyOnBoard }) {
  const [clientId, setClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [contact, setContact] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setClientId(''); setClientName(''); setContact(''); setStartedAt(dayKey()); setError(null)
  }, [open])

  const available = useMemo(
    () => clients.filter((c) => !alreadyOnBoard.has(c.id)),
    [clients, alreadyOnBoard],
  )

  async function submit() {
    if (!clientId && !clientName.trim()) return setError('Выберите клиента или впишите нового')
    setBusy(true)
    setError(null)
    const res = await onSubmit({
      ...(clientId ? { clientId } : { clientName: clientName.trim() }),
      contact: contact.trim(),
      startedAt,
    })
    setBusy(false)
    if (!res.ok) return setError(res.error)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Клиент на доску"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} loading={busy}>Занести</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Клиент из базы"
          placeholder={available.length ? 'Выберите' : 'Все клиенты уже на доске'}
          value={clientId}
          disabled={available.length === 0}
          onChange={(e) => { setClientId(e.target.value); setClientName(''); setError(null) }}
          options={available.map((c) => ({ value: c.id, label: c.name }))}
        />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="caption">или новый</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <Input
          label="Название нового клиента"
          value={clientName}
          onChange={(e) => { setClientName(e.target.value); setClientId(''); setError(null) }}
          placeholder="Появится и в общей базе клиентов"
        />

        <Input
          label="Контакт"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Телеграм, телефон или почта"
        />

        <DatePicker
          label="С какого числа работаем"
          value={startedAt}
          onChange={setStartedAt}
          today={dayKey()}
          max={dayKey()}
          hint="От этой даты считается, сколько клиент с нами"
        />

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
