import { useCallback, useEffect, useState } from 'react'
import { AvatarStack, Button, Card } from '../../shared/ui'
import { useMotivationStore } from '../../core/store/motivationStore'
import { useClientsStore } from '../../core/store/clientsStore'
import { dateTime } from '../../utils/motivation'
import { TopUpModal } from './TopUpModal'

/**
 * «Новые работы — пополнить банк?» над очередью заявок. В Иерархии
 * появилась работа: значит, пришёл клиент или новый объём, и, возможно,
 * пора пополнить банк исполнителям. Кнопка открывает пополнение уже с
 * клиентом и исполнителями; пополнили — подсказка уходит. «Не нужно» —
 * тоже уходит, без денег.
 */
export function HintsBlock() {
  const { fetchHints, markHintDone, dismissHint, fetchEmployees, employees, topUp } = useMotivationStore()
  const clients = useClientsStore((s) => s.clients)
  const fetchClients = useClientsStore((s) => s.fetchClients)
  const [hints, setHints] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)
  const [topUpFor, setTopUpFor] = useState(null)

  const load = useCallback(async () => {
    const res = await fetchHints()
    if (res.ok) setHints(res.data)
    else setError(res.error)
  }, [fetchHints])

  useEffect(() => { load(); fetchEmployees(); fetchClients() }, [load, fetchEmployees, fetchClients])

  async function dismiss(hint) {
    setBusy(hint.id)
    const res = await dismissHint(hint.id)
    setBusy(null)
    if (res.ok) setHints((list) => list.filter((h) => h.id !== hint.id))
    else setError(res.error)
  }

  async function submitTopUp(body) {
    const res = await topUp(body)
    if (res.ok && topUpFor) {
      // Банк пополнен в любом случае; подсказку убираем, только если сервер
      // её закрыл, — иначе она вернулась бы после обновления страницы.
      const done = await markHintDone(topUpFor.id)
      if (done.ok) setHints((list) => list.filter((h) => h.id !== topUpFor.id))
      else setError(`Банк пополнен, но подсказку закрыть не удалось: ${done.error}`)
    }
    return res
  }

  if (!hints.length && !error) return null

  return (
    <Card className="flex flex-col gap-3">
      <p className="caption">Новые работы — пополнить банк?</p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <ul className="flex flex-col divide-y divide-line">
        {hints.map((h) => (
          <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-semibold leading-snug">{h.work.title}</p>
              <p className="text-xs text-ink-3">
                {[h.client?.name && `Клиент: ${h.client.name}`, h.department, h.createdBy && `создал(а) ${h.createdBy}`, dateTime(h.createdAt)].filter(Boolean).join(' · ')}
              </p>
              {h.assignees.length > 0 ? (
                <div className="flex items-center gap-2 pt-0.5">
                  <AvatarStack users={h.assignees.map((a) => ({ id: a.id, name: a.name, email: a.email, src: a.avatarUrl, color: a.avatarColor }))} size={24} />
                  <span className="text-xs text-ink-2">{h.assignees.map((a) => a.name).join(', ')}</span>
                </div>
              ) : (
                <p className="text-xs text-ink-3">Исполнители с банком не назначены — выберите в форме</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" loading={busy === h.id} onClick={() => dismiss(h)}>Не нужно</Button>
              <Button size="sm" onClick={() => setTopUpFor(h)}>Пополнить банк</Button>
            </div>
          </li>
        ))}
      </ul>

      <TopUpModal
        open={Boolean(topUpFor)}
        onClose={() => setTopUpFor(null)}
        employees={employees}
        clients={clients}
        preselected={topUpFor?.assignees.map((a) => a.id) ?? []}
        presetClientId={topUpFor?.client?.id ?? ''}
        onSubmit={async (body) => {
          const res = await submitTopUp(body)
          if (res.ok) setTopUpFor(null)
          return res
        }}
      />
    </Card>
  )
}
