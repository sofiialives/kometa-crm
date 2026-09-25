import { useEffect, useState } from 'react'
import { Button, DatePicker, Input, Modal, Select } from '../../shared/ui'
import { dayKey } from '../../utils/board'

// Готовые причины из задания. «Другое» открывает поле для своей формулировки.
const REASONS = [
  'Не устроила цена',
  'Не устроил результат',
  'Закончился бюджет',
  'Другое',
]

/**
 * Клиент ушёл. Причина обязательна — ради неё колонка ушедших и заводится:
 * доска нужна, чтобы видеть не только сколько заработали, но и почему
 * перестали.
 */
export function LeaveModal({ open, onClose, onSubmit, card }) {
  const [reason, setReason] = useState('')
  const [custom, setCustom] = useState('')
  const [leftAt, setLeftAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setReason(''); setCustom(''); setLeftAt(dayKey()); setError(null)
  }, [open])

  const value = reason === 'Другое' ? custom.trim() : reason

  async function submit() {
    if (!value) return setError('Укажите причину ухода')
    setBusy(true)
    setError(null)
    const res = await onSubmit({ reason: value, leftAt })
    setBusy(false)
    if (!res.ok) return setError(res.error)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${card?.client?.name || 'Клиент'} уходит`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="danger" onClick={submit} loading={busy}>Перенести в ушедшие</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Причина"
          required
          placeholder="Выберите"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(null) }}
          options={REASONS.map((r) => ({ value: r, label: r }))}
        />

        {reason === 'Другое' && (
          <Input
            label="Своя формулировка"
            required
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setError(null) }}
            placeholder="Например: ушли к другому подрядчику"
          />
        )}

        <DatePicker label="Дата ухода" value={leftAt} onChange={setLeftAt} today={dayKey()} max={dayKey()} />

        <p className="text-xs text-ink-3 leading-relaxed">
          Цифры за прошлые месяцы останутся в сводке — клиент тогда работал, и выручка агентства была.
        </p>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
