import { useEffect, useState } from 'react'
import { Button, Input, Modal, Textarea } from '../../shared/ui'
import { buildDeadlineMsk, defaultMskTimeValue, isPastMsk, mskDateValueIn, splitDeadlineMsk, MSK_TZ } from '../../utils/tasks'

/**
 * Одно окно и на создание, и на правку: поля те же, и держать две почти
 * одинаковые формы значило бы чинить потом каждую мелочь дважды.
 * call === null — создаём, иначе правим.
 *
 * Правка нужна именно под перенос: звонок сдвинули на час или на день,
 * и человек меняет время сам, не заводя карточку заново.
 */
export function CallModal({ open, call, presetDay, canManage = true, onClose, onSubmit, onDelete }) {
  const editing = Boolean(call)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(mskDateValueIn)
  const [time, setTime] = useState(defaultMskTimeValue)
  const [note, setNote] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Пересобираем поля на каждое открытие: иначе окно, открытое вчера
  // вечером и не перезагруженное, подставит вчерашний день, а при правке
  // покажет данные предыдущей карточки.
  useEffect(() => {
    if (!open) return
    setError(null)
    if (call) {
      const { date: d, time: t } = splitDeadlineMsk(call.scheduledAt)
      setTitle(call.title)
      setDate(d)
      setTime(t)
      setNote(call.note || '')
    } else {
      setTitle('')
      setDate(presetDay || mskDateValueIn())
      setTime(defaultMskTimeValue())
      setNote('')
    }
  }, [open, call, presetDay])

  const past = isPastMsk(date, time)
  const whenLabel = safeWhenLabel(date, time)
  const hint = past
    ? 'Это время уже прошло — звонок сразу получит пометку «прошёл» и уйдёт ночью'
    : whenLabel

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    let scheduledAt
    try {
      scheduledAt = buildDeadlineMsk(date, time)
    } catch {
      setError('Укажите корректные день и время')
      return
    }

    setLoading(true)
    const res = await onSubmit({ title, note, scheduledAt })
    setLoading(false)
    if (res.ok) onClose()
    else setError(res.error)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Звонок' : 'Новый звонок'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="С кем звонок"
          placeholder="Например: Ozon, обсудить бюджет"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canManage}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="День"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={!canManage}
            required
          />
          <Input
            type="time"
            label="Время (МСК)"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={!canManage}
            required
          />
        </div>

        {hint && <p className="caption -mt-1">{hint}</p>}

        <Textarea
          label="Заметка"
          placeholder="Необязательно: о чём звонок, что подготовить"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={!canManage}
          rows={3}
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        {canManage && (
          <div className="flex items-center gap-3 pt-1">
            {editing && onDelete && (
              <Button type="button" variant="ghost" className="mr-auto !text-danger" onClick={() => onDelete(call)}>
                Удалить
              </Button>
            )}
            <Button type="button" variant="ghost" className={editing ? '' : 'ml-auto'} onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={loading}>{editing ? 'Сохранить' : 'Создать'}</Button>
          </div>
        )}
      </form>
    </Modal>
  )
}

function safeWhenLabel(date, time) {
  if (!date || !time) return ''
  try {
    const d = new Date(`${date}T12:00:00Z`)
    const when = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: MSK_TZ })
    return `Звонок: ${when}, в ${time}`
  } catch {
    return ''
  }
}
