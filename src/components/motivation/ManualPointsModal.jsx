import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Input, Modal, Select, Spinner, Textarea } from '../../shared/ui'
import { eventPoints, newRequestKey } from '../../utils/motivation'

const ADJUSTMENT = '__adjustment'

/**
 * «Добавить баллы вручную»: сотрудник, событие, баллы (для ручной
 * корректировки) и комментарий.
 *
 * События берутся из профиля выбранного человека: у дизайнера свои, у
 * разработчика свои, поэтому список подгружается после выбора сотрудника.
 * Автоматических событий здесь нет — их ставит система по задачам.
 */
export function ManualPointsModal({ open, onClose, employees, preselected, loadOptions, onSubmit }) {
  const [userId, setUserId] = useState('')
  const [options, setOptions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [eventTypeId, setEventTypeId] = useState('')
  const [prize, setPrize] = useState('')
  const [split, setSplit] = useState(false)
  const [level, setLevel] = useState('')
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState({})
  // Ошибка поля гаснет, как только его начали исправлять.
  const clear = (key) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e))
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [requestKey, setRequestKey] = useState(null)

  useEffect(() => {
    if (!open) return
    setUserId(preselected || '')
    setOptions(null)
    setEventTypeId('')
    setPrize('')
    setSplit(false)
    setLevel('')
    setComment('')
    setErrors({})
    setServerError(null)
    setRequestKey(newRequestKey())
  }, [open, preselected])

  useEffect(() => {
    if (!open || !userId) { setOptions(null); setLoading(false); return undefined }
    let alive = true
    setLoading(true)
    loadOptions(userId).then((res) => {
      if (!alive) return
      setOptions(res.ok ? res.data : { events: [], error: res.error })
      setEventTypeId('')
    }).finally(() => { if (alive) setLoading(false) })
    // Окно закрыли или выбрали другого — индикатор не должен зависнуть.
    return () => { alive = false; setLoading(false) }
  }, [open, userId, loadOptions])

  const eventOptions = useMemo(() => [
    ...(options?.events ?? []).map((e) => ({ value: e.id, label: `${e.title} (${eventPoints(e)})` })),
    { value: ADJUSTMENT, label: 'Ручная корректировка — любое число баллов' },
  ], [options])

  const isAdjustment = eventTypeId === ADJUSTMENT

  async function submit() {
    if (busy) return
    const next = {}
    if (!userId) next.userId = 'Выберите сотрудника'
    if (!eventTypeId) next.eventTypeId = 'Выберите событие или корректировку'
    if (isAdjustment) {
      // Пустое поле — не ноль: Number('') даёт 0 и молча прошло бы проверку.
      const p = Number(prize)
      if (!prize.trim() || !Number.isInteger(p) || p < -100 || p > 100) next.prize = 'Целое число от −100 до 100'
      if (split) {
        const l = Number(level)
        if (!level.trim() || !Number.isInteger(l) || l < -100 || l > 100) next.level = 'Целое число от −100 до 100'
      }
      if (p === 0 && (!split || Number(level) === 0)) next.prize = 'Ноль баллов ничего не меняет'
    }
    if (!comment.trim()) next.comment = 'Напишите, за что баллы — это обязательно'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    setServerError(null)
    const body = isAdjustment
      ? { userId, prizePoints: Number(prize), levelPoints: split ? Number(level) : Number(prize), comment: comment.trim(), requestKey }
      : { userId, eventTypeId, comment: comment.trim(), requestKey }
    const res = await onSubmit(body)
    setBusy(false)
    if (res?.ok) onClose()
    else setServerError(res?.error || 'Не удалось добавить баллы')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Добавить баллы вручную"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={busy} onClick={submit}>Добавить</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Сотрудник"
          required
          placeholder="Выберите сотрудника"
          options={employees.map((e) => ({ value: e.id, label: e.profile ? `${e.name} — ${e.profile.title}` : e.name }))}
          value={userId}
          onChange={(e) => { setUserId(e.target.value); clear('userId') }}
          error={errors.userId}
        />

        {loading && <div className="grid place-items-center py-2"><Spinner /></div>}

        {userId && !loading && options?.error && (
          <p className="text-sm text-danger">Не удалось загрузить события сотрудника: {options.error}</p>
        )}

        {userId && !loading && options && !options.error && (
          <>
            {!options.profile && (
              <p className="text-sm text-warn">
                У сотрудника не назначен профиль — событий нет, доступна только ручная корректировка.
              </p>
            )}
            <Select
              label="Событие"
              required
              placeholder="Что произошло"
              options={eventOptions}
              value={eventTypeId}
              onChange={(e) => { setEventTypeId(e.target.value); clear('eventTypeId') }}
              error={errors.eventTypeId}
            />
          </>
        )}

        {isAdjustment && (
          <div className="flex flex-col gap-3 rounded-lg bg-panel-2 p-3">
            <Input
              label={split ? 'Баллы в премию' : 'Баллы'}
              required
              inputMode="numeric"
              placeholder="Например, 5 или −3"
              value={prize}
              onChange={(e) => { setPrize(e.target.value.replace(/[^\d-−]/g, '').replace('−', '-')); clear('prize') }}
              error={errors.prize}
              hint="Плюс добавляет баллы, минус снимает"
            />
            <Checkbox label="По-разному для премии и уровня работы" checked={split} onChange={(e) => setSplit(e.target.checked)} />
            {split && (
              <Input
                label="Баллы в уровень работы"
                required
                inputMode="numeric"
                value={level}
                onChange={(e) => { setLevel(e.target.value.replace(/[^\d-−]/g, '').replace('−', '-')); clear('level') }}
                error={errors.level}
              />
            )}
          </div>
        )}

        <Textarea
          label="Комментарий"
          required
          rows={2}
          placeholder="За что баллы: через месяц без этого никто не вспомнит"
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
