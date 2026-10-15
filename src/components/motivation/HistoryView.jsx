import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, EmptyState, Select, Spinner } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { useMotivationStore } from '../../core/store/motivationStore'
import { dateTime, monthHeading, pointsTone, signedPoints, withDepartment } from '../../utils/motivation'
import { useAutoRefresh } from '../../shared/lib/useAutoRefresh'

const SOURCE = {
  auto: 'авто',
  manual: 'вручную',
  review: 'по решению',
  rejected: 'не начислено',
  withdrawn: 'заявку сняла система',
}

/**
 * История баллов: кому, сколько, за что и когда. У каждой записи пометка,
 * как она появилась: сама по правилу, вручную или по решению на заявку.
 * Фильтры по месяцу, отделу и человеку. Владелец видит всех, руководитель —
 * специалистов своего отдела.
 */
export function HistoryView({ isAdmin }) {
  const fetchHistory = useMotivationStore((s) => s.fetchHistory)
  const fetchPeople = useMotivationStore((s) => s.fetchBotJournalPeople)
  const fetchTeamMonths = useMotivationStore((s) => s.fetchTeamMonths)
  const teamMonths = useMotivationStore((s) => s.teamMonths)

  const [people, setPeople] = useState([])
  const [month, setMonth] = useState('all')
  const [departmentId, setDepartmentId] = useState('')
  const [userId, setUserId] = useState('')
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTeamMonths()
    // Руководителю история показывает только специалистов его отдела —
    // себя и других руководителей в выборе не держим.
    fetchPeople().then((res) => { if (res.ok) setPeople(isAdmin ? res.data : res.data.filter((p) => p.role === 'staff')) })
  }, [fetchPeople, fetchTeamMonths, isAdmin])

  const departments = useMemo(() => {
    const map = new Map()
    for (const p of people) if (p.department) map.set(p.department.id, p.department.name)
    return [...map].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  }, [people])
  const shownPeople = people.filter((p) => !departmentId || p.department?.id === departmentId)

  // Ответ на запрос с прежними фильтрами, пришедший поздно, не должен
  // смешаться с новой выборкой.
  const latest = useRef(0)
  const filters = { month, departmentId: departmentId || undefined, userId: userId || undefined }

  useEffect(() => {
    const n = ++latest.current
    setLoading(true)
    setError(null)
    fetchHistory({ month, departmentId: departmentId || undefined, userId: userId || undefined }).then((res) => {
      if (n !== latest.current) return
      setLoading(false)
      if (res.ok) setPage(res.data); else setError(res.error)
    })
  }, [fetchHistory, month, departmentId, userId])

  // Новые записи сверху сами, пока человек не листал дальше первой страницы.
  useAutoRefresh(() => {
    if (loading || (page && page.items.length > 100)) return
    const n = ++latest.current
    fetchHistory(filters).then((res) => { if (n === latest.current && res.ok) setPage(res.data) })
  })

  async function more() {
    const n = ++latest.current
    setLoading(true)
    const res = await fetchHistory({ ...filters, before: page.next })
    if (n !== latest.current) return
    setLoading(false)
    if (res.ok) setPage((p) => ({ ...res.data, items: [...p.items, ...res.data.items] }))
    else setError(res.error)
  }

  const monthOptions = [{ value: 'all', label: 'Всё время' }, ...teamMonths.map((m) => ({ value: m, label: monthHeading(m) }))]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Select size="sm" className="w-48" options={monthOptions} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Месяц" />
        {isAdmin && departments.length > 1 && (
          <Select
            size="sm"
            className="w-56"
            placeholder="Все отделы"
            options={departments}
            value={departmentId}
            onChange={(e) => { setDepartmentId(e.target.value); setUserId('') }}
            aria-label="Отдел"
          />
        )}
        <Select
          size="sm"
          className="w-64"
          placeholder="Все люди"
          options={shownPeople.map((p) => ({ value: p.id, label: withDepartment(p.name, p.department) }))}
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          aria-label="Человек"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {!page && loading ? (
        <div className="grid place-items-center py-14"><Spinner /></div>
      ) : page && page.items.length === 0 ? (
        <Card><EmptyState label="Записей нет" text="Здесь появятся все баллы: за задачи, звонки, чек-ины и начисленные вручную." /></Card>
      ) : page && (
        <Card className="flex flex-col">
          <ul className="flex flex-col divide-y divide-line">
            {page.items.map((i) => <Row key={i.id} item={i} />)}
          </ul>
          {page.more && (
            <div className="pt-3">
              <Button size="sm" variant="secondary" loading={loading} onClick={more}>Показать ещё</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

function Row({ item }) {
  const cancelled = Boolean(item.cancelled)
  // Заявка, по которой решили «не начислять» или которую сняла система:
  // баллов нет, показываем, сколько предлагалось.
  const declined = item.kind === 'review'
  const source = SOURCE[item.source] || item.source
  return (
    <li className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_1fr_auto] sm:items-start">
      <span className="text-xs text-ink-3 tabular-nums">{dateTime(item.at)}</span>
      <div className={cx('flex min-w-0 flex-col gap-0.5', cancelled && 'opacity-60')}>
        <span className="text-sm font-medium">{withDepartment(item.user.name, item.user.department)}</span>
        <span className={cx('text-sm', cancelled && 'line-through')}>
          {item.title}{item.taskTitle ? ` «${item.taskTitle}»` : ''}{item.clientName ? `, клиент ${item.clientName}` : ''}
        </span>
        {item.comment && <span className="text-xs text-ink-3">{item.comment}</span>}
        <span className="text-xs text-ink-3">
          {source}{item.by ? `, ${item.by}` : ''}
          {cancelled && ` · отменено${item.cancelled.by ? `, ${item.cancelled.by}` : ''}${item.cancelled.reason ? `: ${item.cancelled.reason}` : ''}`}
        </span>
      </div>
      {declined ? (
        <span className="text-sm text-ink-3 tabular-nums">0, предлагалось {signedPoints(item.suggestedPoints)}</span>
      ) : (
        <span className={cx('text-sm font-semibold tabular-nums', cancelled ? 'text-ink-3 line-through' : pointsTone(item.prizePoints))}>
          {signedPoints(item.prizePoints)}
          {item.levelPoints !== item.prizePoints && <span className="ml-1 text-xs font-normal text-ink-3">уровень {signedPoints(item.levelPoints)}</span>}
        </span>
      )}
    </li>
  )
}
