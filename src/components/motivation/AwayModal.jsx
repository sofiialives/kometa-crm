import { useEffect, useState } from 'react'
import { Button, DatePicker, Modal, Textarea, TimePicker } from '../../shared/ui'
import { useMotivationStore } from '../../core/store/motivationStore'
import { todayKey } from '../../utils/calls'

const DEFAULT_HOUR = 20

/** Ближайшие 20:00 по Москве: сегодня, а если уже поздно — завтра. */
function defaultUntil() {
  const today = todayKey()
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Moscow', hour: '2-digit', hour12: false }).format(new Date()))
  if (hour < DEFAULT_HOUR) return { day: today, time: `${DEFAULT_HOUR}:00` }
  const [y, m, d] = today.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
  return { day: next, time: `${DEFAULT_HOUR}:00` }
}

/**
 * Метка «форс-мажор до …». Ставит владелец, когда человек предупредил, что
 * его не будет. Время — по Москве, как и всё в CRM. Новая метка заменяет
 * прежнюю, если та ещё действовала.
 */
export function AwayModal({ open, employee, onClose, onSaved }) {
  const setAway = useMotivationStore((s) => s.setAway)
  const [day, setDay] = useState(() => defaultUntil().day)
  const [time, setTime] = useState(() => defaultUntil().time)
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    const { day: d, time: t } = defaultUntil()
    setDay(d)
    setTime(t)
    setReason('')
    setError(null)
  }, [open])

  async function submit() {
    if (busy) return
    if (!day || !/^\d{2}:\d{2}$/.test(time || '')) {
      setError('Укажите день и время, до которых действует форс-мажор')
      return
    }
    const until = new Date(`${day}T${time}:00+03:00`)
    if (!(until > new Date())) {
      setError('Это время уже прошло')
      return
    }
    setBusy(true)
    setError(null)
    const res = await setAway({ userId: employee.id, until: until.toISOString(), reason: reason.trim() || undefined })
    setBusy(false)
    if (res.ok) onSaved?.()
    else setError(res.error || 'Не удалось поставить метку')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Форс-мажор"
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={busy} onClick={submit}>Поставить метку</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-2 leading-relaxed">
          {employee?.name}: метка видна в журнале звонка и в таблице команды. Когда появится бот, он не будет беспокоить человека до этого времени.
        </p>
        <div className="grid grid-cols-5 gap-3">
          <DatePicker className="col-span-3" label="До какого дня" value={day} onChange={(v) => { setError(null); setDay(v) }} today={todayKey()} min={todayKey()} required />
          <TimePicker className="col-span-2" label="Время (МСК)" value={time} onChange={(v) => { setError(null); setTime(v) }} required />
        </div>
        <Textarea label="Причина" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Например: заболел, дела в банке" />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
