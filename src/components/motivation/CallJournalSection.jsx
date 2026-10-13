import { useCallback, useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Card, DatePicker, EmptyState, Spinner } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { useMotivationStore } from '../../core/store/motivationStore'
import { todayKey } from '../../utils/calls'
import { dateTime, signedPoints } from '../../utils/motivation'
import { AwayModal } from './AwayModal'

/**
 * Журнал вечернего звонка — как в школе: открыл день, отметил каждого.
 *
 * «Был» и «не был» сразу ложатся баллами событий профиля «Был на созвоне»
 * и «Пропустил звонок», форс-мажор — без баллов. Нажать активную отметку
 * ещё раз — снять её. Если человек предупредил, что его не будет, владелец
 * ставит ему метку «форс-мажор до …»: она видна здесь и в таблице команды,
 * а бот (когда появится) человека не дёргает.
 */

const STATUSES = [
  { id: 'present', label: 'Был', active: 'bg-ok text-white border-ok' },
  { id: 'absent', label: 'Не был', active: 'bg-danger text-white border-danger' },
  { id: 'excused', label: 'Форс-мажор', active: 'bg-warn text-white border-warn' },
]

function monthStartKey(today) {
  return `${today.slice(0, 7)}-01`
}

export function CallJournalSection() {
  const { fetchCallJournal, setCallMark, endAway } = useMotivationStore()
  const today = todayKey()
  const [day, setDay] = useState(today)
  const [journal, setJournal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(() => new Set())
  const [rowError, setRowError] = useState({})
  const [awayFor, setAwayFor] = useState(null)
  const [bulkConfirm, setBulkConfirm] = useState(false)

  const load = useCallback(async (d) => {
    setLoading(true)
    setError(null)
    const res = await fetchCallJournal(d)
    setLoading(false)
    if (res.ok) setJournal(res.data)
    else setError(res.error)
  }, [fetchCallJournal])

  useEffect(() => { setBulkConfirm(false); load(day) }, [day, load])

  const setBusyFor = (id, on) => setBusy((s) => {
    const next = new Set(s)
    if (on) next.add(id); else next.delete(id)
    return next
  })

  async function mark(row, status) {
    const id = row.employee.id
    if (busy.has(id)) return
    const next = row.status === status ? null : status
    setBusyFor(id, true)
    setRowError((e) => ({ ...e, [id]: null }))
    const res = await setCallMark(day, id, next)
    setBusyFor(id, false)
    if (!res.ok) {
      setRowError((e) => ({ ...e, [id]: res.error }))
      return
    }
    setJournal((j) => j && ({
      ...j,
      summary: res.data.summary,
      rows: j.rows.map((r) => (r.employee.id === id ? res.data.row : r)),
    }))
  }

  // Остальным — «был»: кого ещё не отметили и у кого нет форс-мажора.
  const rest = useMemo(() => (journal?.rows ?? []).filter((r) => !r.status && !r.away), [journal])
  async function markRestPresent() {
    setBulkConfirm(false)
    for (const row of rest) {
      await mark(row, 'present')
    }
  }

  async function dropAway(row) {
    const res = await endAway(row.away.id)
    if (res.ok) load(day)
    else setRowError((e) => ({ ...e, [row.employee.id]: res.error }))
  }

  const groups = useMemo(() => {
    const map = new Map()
    for (const r of journal?.rows ?? []) {
      const name = r.employee.department?.name || 'Без отдела'
      if (!map.has(name)) map.set(name, [])
      map.get(name).push(r)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'ru'))
  }, [journal])

  const s = journal?.summary
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <DatePicker
          className="w-full sm:w-64"
          label="День звонка"
          value={day}
          onChange={setDay}
          today={today}
          min={monthStartKey(today)}
          max={today}
        />
        {s && (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink-2">
              Отмечено {s.total - s.unmarked} из {s.total}: был {s.present}, не был {s.absent}, форс-мажор {s.excused}
            </p>
            {rest.length > 0 && (bulkConfirm ? (
              <span className="flex items-center gap-2">
                <Button size="sm" onClick={markRestPresent}>Да, отметить {rest.length}</Button>
                <Button size="sm" variant="ghost" onClick={() => setBulkConfirm(false)}>Отмена</Button>
              </span>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setBulkConfirm(true)}>Остальным — «был»</Button>
            ))}
          </div>
        )}
      </div>

      {loading && !journal ? (
        <div className="grid place-items-center py-14"><Spinner /></div>
      ) : error && !journal ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !journal?.rows.length ? (
        <Card><EmptyState label="Некого отмечать" text="В журнале — все, у кого есть банк премии: сотрудники и руководители." /></Card>
      ) : (
        groups.map(([name, rows]) => (
          <Card key={name} className="flex flex-col gap-1">
            <p className="caption pb-1">{name}</p>
            <ul className="flex flex-col divide-y divide-line">
              {rows.map((row) => (
                <JournalRow
                  key={row.employee.id}
                  row={row}
                  busy={busy.has(row.employee.id)}
                  error={rowError[row.employee.id]}
                  onMark={(status) => mark(row, status)}
                  onAway={() => setAwayFor(row.employee)}
                  onDropAway={() => dropAway(row)}
                />
              ))}
            </ul>
          </Card>
        ))
      )}

      <AwayModal
        open={Boolean(awayFor)}
        employee={awayFor}
        onClose={() => setAwayFor(null)}
        onSaved={() => { setAwayFor(null); load(day) }}
      />
    </div>
  )
}

function JournalRow({ row, busy, error, onMark, onAway, onDropAway }) {
  const e = row.employee
  const priceOf = (id) => (id === 'present' ? row.points.present : id === 'absent' ? row.points.absent : null)
  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={e.name} email={e.email} src={e.avatarUrl} color={e.avatarColor} size={32} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">{e.name}</span>
            <span className="truncate text-xs text-ink-3">{row.profile?.title || 'Профиль не назначен'}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Отметка: ${e.name}`}>
          {STATUSES.map((st) => {
            const price = priceOf(st.id)
            const on = row.status === st.id
            return (
              <button
                key={st.id}
                type="button"
                disabled={busy}
                aria-pressed={on}
                onClick={() => onMark(st.id)}
                title={on ? 'Нажмите ещё раз, чтобы снять отметку' : st.id !== 'excused' && price === null ? 'В профиле нет этого события или оно выключено — баллов не будет' : undefined}
                className={cx(
                  'rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50',
                  on ? st.active : 'border-line-2 text-ink-2 hover:text-ink hover:border-ink-3',
                )}
              >
                {st.label}
                {st.id !== 'excused' && price !== null && <span className="ml-1 tabular-nums opacity-80">{signedPoints(price)}</span>}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-11 text-xs">
        {row.away ? (
          <>
            <span className="rounded-md bg-warn-soft px-1.5 py-0.5 font-semibold text-warn">
              Форс-мажор до {dateTime(row.away.until)}
            </span>
            {row.away.reason && <span className="text-ink-3">{row.away.reason}</span>}
            <button type="button" className="text-accent hover:underline cursor-pointer" onClick={onDropAway}>Снять метку</button>
          </>
        ) : (
          <button type="button" className="text-ink-3 hover:text-accent cursor-pointer" onClick={onAway}>Поставить форс-мажор…</button>
        )}
        {row.status && row.awarded !== null && <span className="text-ink-3">начислено {signedPoints(row.awarded)}</span>}
      </div>
      {error && <p className="pl-11 text-xs text-danger">{error}</p>}
    </li>
  )
}
