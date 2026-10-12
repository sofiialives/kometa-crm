import { useEffect, useMemo, useState } from 'react'
import { Button, Modal, MoneyInput, Select, Textarea } from '../../shared/ui'
import { EmployeePicker } from './EmployeePicker'
import { BANK_REASONS, MAX_DOLLARS, money } from '../../utils/motivation'
import { useRequestKey } from './useRequestKey'

/**
 * «Пополнить банк»: сотрудник (можно нескольких), сумма, причина, клиент
 * (если причина — новый клиент) и комментарий. Поля — ровно из задания.
 *
 * Каждый выбранный получает полную сумму. Это стоит сказать прямо в форме:
 * «50 $ троим» легко прочитать как «50 $ на троих».
 */
export function TopUpModal({ open, onClose, employees, clients, preselected = [], onSubmit }) {
  const [userIds, setUserIds] = useState([])
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('new_client')
  const [clientId, setClientId] = useState('')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState({})
  // Ошибка поля гаснет, как только его начали исправлять.
  const clear = (key) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)
  const keyFor = useRequestKey(open)

  useEffect(() => {
    if (!open) return
    setUserIds(preselected)
    setAmount('')
    setReason('new_client')
    setClientId('')
    setComment('')
    setErrors({})
    setServerError(null)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const clientOptions = useMemo(() => clients.map((c) => ({ value: c.id, label: c.name })), [clients])
  const total = Number(amount || 0) * 100 * userIds.length

  async function submit() {
    // Второе нажатие, пока первое ещё в пути, ничего не делает.
    if (busy) return
    const next = {}
    if (userIds.length === 0) next.userIds = 'Выберите хотя бы одного сотрудника'
    if (!(Number(amount) > 0)) next.amount = 'Укажите сумму больше нуля'
    // Суммы банка — целые доллары: в задании всё округляется до доллара.
    else if (!Number.isInteger(Number(amount))) next.amount = 'Целое число долларов, без центов'
    else if (Number(amount) > MAX_DOLLARS) next.amount = 'Не больше 1 000 000 $ за раз'
    if (reason === 'new_client' && !clientId) next.clientId = 'Выберите клиента'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    setServerError(null)
    const body = {
      userIds,
      amount: Number(amount),
      reason,
      clientId: reason === 'new_client' ? clientId : clientId || undefined,
      comment: comment.trim() || undefined,
    }
    const res = await onSubmit({ ...body, requestKey: keyFor(body) })
    setBusy(false)
    if (res?.ok) onClose()
    else setServerError(res?.error || 'Не удалось пополнить банк')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Пополнить банк"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={busy} onClick={submit}>Пополнить</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <EmployeePicker employees={employees} value={userIds} onChange={(v) => { setUserIds(v); clear('userIds') }} required error={errors.userIds} />

        <MoneyInput
          label="Сумма каждому"
          required
          value={amount}
          onChange={(v) => { setAmount(v); clear('amount') }}
          error={errors.amount}
          hint={userIds.length > 1 && Number(amount) > 0 ? `Каждый получит ${money(Number(amount) * 100)}, всего ${money(total)}` : undefined}
        />

        <Select
          label="Причина"
          required
          options={BANK_REASONS}
          value={reason}
          onChange={(e) => { setReason(e.target.value); clear('clientId') }}
        />

        <Select
          label="Клиент"
          required={reason === 'new_client'}
          placeholder={reason === 'new_client' ? 'Выберите клиента' : 'Не указан'}
          options={clientOptions}
          value={clientId}
          onChange={(e) => { setClientId(e.target.value); clear('clientId') }}
          error={errors.clientId}
        />

        <Textarea label="Комментарий" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />

        {serverError && <p className="text-sm text-danger">{serverError}</p>}
      </div>
    </Modal>
  )
}
