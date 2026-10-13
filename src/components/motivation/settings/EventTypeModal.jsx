import { useState } from 'react'
import { Button, Checkbox, Input, Modal, Select, Textarea } from '../../../shared/ui'
import { AUTO_RULES } from '../../../utils/motivation'

const MODES = [
  { value: 'manual', label: 'Вручную, отмечает владелец' },
  { value: 'auto', label: 'Автоматически по задачам CRM' },
]

/**
 * Событие профиля: название, пример, баллы в премию и в уровень, как
 * фиксируется, включено ли. По умолчанию баллы одинаковые в обе шкалы —
 * отдельное поле для уровня открывается галочкой, как в задании: «если
 * владелец хочет, чтобы событие влияло на шкалы по-разному, он меняет только
 * одно поле».
 */
// Окно монтируется заново на каждое открытие (родитель задаёт key), поэтому
// поля берутся из события сразу в начальном состоянии. Через эффект они
// заполнялись бы после первого кадра, и поле баллов на миг мелькало пустым.
export function EventTypeModal({ open, event, onClose, onSubmit }) {
  const [title, setTitle] = useState(() => event?.title || '')
  const [example, setExample] = useState(() => event?.example || '')
  const [prize, setPrize] = useState(() => (event ? String(event.prizePoints) : ''))
  const [split, setSplit] = useState(() => Boolean(event && event.prizePoints !== event.levelPoints))
  const [level, setLevel] = useState(() => (event ? String(event.levelPoints) : ''))
  const [mode, setMode] = useState(() => event?.mode || 'manual')
  const [autoRule, setAutoRule] = useState(() => event?.autoRule || '')
  const [enabled, setEnabled] = useState(() => (event ? event.enabled : true))
  const [errors, setErrors] = useState({})
  // Ошибка поля гаснет, как только его начали исправлять.
  const clear = (key) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)

  const isProduct = event?.systemKey === 'client_product'
  const isCall = event?.systemKey === 'call_attended' || event?.systemKey === 'call_missed'
  const isCheckin = event?.systemKey === 'checkin_missed'

  const cleanNumber = (v) => v.replace(/[^\d-−]/g, '').replace('−', '-')

  async function submit() {
    const next = {}
    if (!title.trim()) next.title = 'Укажите название'
    // Пустое поле — не ноль: Number('') даёт 0 и молча сохранило бы событие
    // без баллов.
    const p = Number(prize)
    if (!prize.trim() || !Number.isInteger(p) || p < -100 || p > 100) next.prize = 'Целое число от −100 до 100'
    const l = split ? Number(level) : p
    if (split && (!level.trim() || !Number.isInteger(l) || l < -100 || l > 100)) next.level = 'Целое число от −100 до 100'
    if (mode === 'auto' && !autoRule) next.autoRule = 'Выберите, по какому правилу событие начисляется'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    setServerError(null)
    const res = await onSubmit({
      title: title.trim(),
      example: example.trim() || null,
      prizePoints: p,
      levelPoints: l,
      mode,
      autoRule: mode === 'auto' ? autoRule : null,
      enabled,
    })
    setBusy(false)
    if (res?.ok) onClose()
    else setServerError(res?.error || 'Не удалось сохранить событие')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={event ? 'Событие профиля' : 'Новое событие'}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={busy} onClick={submit}>Сохранить</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <Input label="Название" required value={title} onChange={(e) => { setTitle(e.target.value); clear('title') }} error={errors.title} maxLength={200} />
        <Textarea label="Короткий пример для сотрудника" rows={2} value={example} onChange={(e) => setExample(e.target.value)} maxLength={300} />

        <Input
          label={split ? 'Баллы в премию' : 'Баллы'}
          required
          inputMode="numeric"
          value={prize}
          onChange={(e) => { setPrize(cleanNumber(e.target.value)); clear('prize') }}
          error={errors.prize}
          hint="Минус — штраф. Например, −2 за просрочку"
        />
        <Checkbox label="Разные баллы для премии и уровня работы" checked={split} onChange={(e) => setSplit(e.target.checked)} />
        {split && (
          <Input label="Баллы в уровень работы" required inputMode="numeric" value={level} onChange={(e) => { setLevel(cleanNumber(e.target.value)); clear('level') }} error={errors.level} />
        )}

        <Select
          label="Как фиксируется"
          options={MODES}
          value={mode}
          disabled={isProduct || isCall || isCheckin}
          onChange={(e) => setMode(e.target.value)}
          hint={isProduct ? 'Покупку продукта всегда отмечает владелец' : isCall ? 'Звонок отмечают в журнале звонка' : isCheckin ? 'Снимает бот на внезапном чек-ине' : undefined}
        />
        {mode === 'auto' && (
          <Select
            label="Правило"
            required
            placeholder="Выберите правило"
            options={AUTO_RULES}
            value={autoRule}
            onChange={(e) => { setAutoRule(e.target.value); clear('autoRule') }}
            error={errors.autoRule}
            hint="Каждое правило может быть в профиле только один раз"
          />
        )}

        <Checkbox label="Событие включено" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        {serverError && <p className="text-sm text-danger">{serverError}</p>}
      </div>
    </Modal>
  )
}
