import { useEffect, useMemo, useState } from 'react'
import { Button, Input, Modal, Select, Textarea } from '../../shared/ui'
import { EmployeePicker } from './EmployeePicker'

/**
 * «Клиент купил новый продукт». Руководитель выбирает специалистов, чья
 * работа к этому привела, — каждый получает полные баллы события из
 * своего профиля, по заданию это +10.
 *
 * Заказчик объяснил смысл на созвоне: дизайнер сделал работу качественно,
 * клиент захотел ещё и заказал motion-дизайн — значит, дизайнер на это
 * повлиял, и это нужно поощрять.
 */
export function ProductModal({ open, onClose, employees, clients, preselected = [], onSubmit }) {
  const [userIds, setUserIds] = useState([])
  const [clientId, setClientId] = useState('')
  const [product, setProduct] = useState('')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState({})
  // Ошибка поля гаснет, как только его начали исправлять.
  const clear = (key) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)

  useEffect(() => {
    if (!open) return
    setUserIds(preselected)
    setClientId('')
    setProduct('')
    setComment('')
    setErrors({})
    setServerError(null)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const clientOptions = useMemo(() => clients.map((c) => ({ value: c.id, label: c.name })), [clients])

  async function submit() {
    const next = {}
    if (userIds.length === 0) next.userIds = 'Выберите хотя бы одного специалиста'
    if (!product.trim()) next.product = 'Укажите, что купил клиент'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    setServerError(null)
    const res = await onSubmit({
      userIds,
      clientId: clientId || undefined,
      product: product.trim(),
      comment: comment.trim() || undefined,
    })
    setBusy(false)
    if (res?.ok) onClose()
    else setServerError(res?.error || 'Не удалось отметить покупку')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Клиент купил новый продукт"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={busy} onClick={submit}>Отметить</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Клиент"
          placeholder="Выберите клиента"
          options={clientOptions}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        />
        <Input
          label="Продукт"
          required
          placeholder="Например, motion-ролик"
          value={product}
          onChange={(e) => { setProduct(e.target.value); clear('product') }}
          error={errors.product}
          maxLength={200}
        />
        <EmployeePicker
          label="Чья работа к этому привела"
          employees={employees}
          value={userIds}
          onChange={(v) => { setUserIds(v); clear('userIds') }}
          required
          error={errors.userIds}
        />
        <p className="text-xs text-ink-3 leading-relaxed">
          Каждый выбранный получает полные баллы события «Клиент купил дополнительный продукт» из своего профиля.
        </p>
        <Textarea label="Комментарий" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
        {serverError && <p className="text-sm text-danger">{serverError}</p>}
      </div>
    </Modal>
  )
}
