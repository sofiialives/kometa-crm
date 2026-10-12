import { useEffect, useState } from 'react'
import { Button, Modal, Textarea } from '../../shared/ui'
import { eventPoints } from '../../utils/motivation'

/**
 * Отмена события. Причина обязательна: отменённое остаётся в истории, и
 * сотрудник должен видеть не только что баллы вернули или сняли, но и
 * почему.
 */
export function CancelEventModal({ event, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { setReason(''); setError(null) }, [event])

  async function submit() {
    if (busy) return
    if (!reason.trim()) { setError('Напишите, почему отменяете'); return }
    setBusy(true)
    const res = await onSubmit(event.id, reason.trim())
    setBusy(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось отменить событие')
  }

  return (
    <Modal
      open={Boolean(event)}
      onClose={onClose}
      title="Отменить событие"
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Не отменять</Button>
          <Button variant="danger" loading={busy} onClick={submit}>Отменить событие</Button>
        </>
      )}
    >
      {event && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-panel-2 px-3 py-2.5 text-sm">
            <p className="font-medium">{event.title}</p>
            <p className="text-ink-3">{eventPoints(event)}</p>
          </div>
          <p className="text-sm text-ink-2 leading-relaxed">
            Событие останется в истории зачёркнутым, баллы пересчитаются. Удалить его совсем нельзя.
          </p>
          <Textarea
            label="Причина"
            required
            rows={2}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(null) }}
            error={error}
            maxLength={500}
          />
        </div>
      )}
    </Modal>
  )
}
