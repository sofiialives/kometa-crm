import { useEffect, useState } from 'react'
import { Button, Modal, MoneyInput, Textarea } from '../../shared/ui'
import { money } from '../../utils/motivation'

/**
 * Списание из банка — только владелец, например при ошибочном пополнении.
 * Списание — это новая запись со знаком минус, а не правка старой: в
 * истории видно и ошибку, и исправление.
 */
export function WriteOffModal({ open, onClose, employee, bankCents, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState({})
  // Ошибка поля гаснет, как только его начали исправлять.
  const clear = (key) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)

  useEffect(() => {
    if (!open) return
    setAmount('')
    setComment('')
    setErrors({})
    setServerError(null)
  }, [open])

  async function submit() {
    if (busy) return
    const next = {}
    const cents = Math.round(Number(amount) * 100)
    if (!(cents > 0)) next.amount = 'Укажите сумму больше нуля'
    else if (!Number.isInteger(Number(amount))) next.amount = 'Целое число долларов, без центов'
    else if (cents > bankCents) next.amount = `В банке ${money(bankCents)}, больше списать нельзя`
    if (!comment.trim()) next.comment = 'Напишите причину — она останется в истории банка'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    const res = await onSubmit({ userId: employee.id, amount: Number(amount), comment: comment.trim() })
    setBusy(false)
    if (res?.ok) onClose()
    else setServerError(res?.error || 'Не удалось списать')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Списание из банка"
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="danger" loading={busy} onClick={submit}>Списать</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-2">
          {employee?.name}: в банке сейчас <span className="font-semibold text-ink">{money(bankCents)}</span>
        </p>
        <MoneyInput label="Сумма" required value={amount} onChange={(v) => { setAmount(v); clear('amount') }} error={errors.amount} />
        <Textarea
          label="Причина"
          required
          rows={2}
          placeholder="Например, пополнили не тому сотруднику"
          value={comment}
          onChange={(e) => { setComment(e.target.value); clear('comment') }}
          error={errors.comment}
          maxLength={500}
        />
        {serverError && <p className="text-sm text-danger">{serverError}</p>}
      </div>
    </Modal>
  )
}
