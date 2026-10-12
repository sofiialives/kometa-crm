import { useMemo, useState } from 'react'
import { Avatar, Card, EmptyState } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { dollars } from '../../utils/motivation'

/**
 * Таблица команды: имя, должность (профиль), банк, баллы, уровень премии,
 * заработанная сумма, уровень работы. Сортируется по любой колонке —
 * так в задании, и так заказчик в конце месяца смотрит, у кого какой
 * уровень.
 *
 * На телефоне семь колонок не помещаются, поэтому там те же данные идут
 * карточками. Таблицу с прокруткой вбок на телефоне никто не читает.
 */

const COLUMNS = [
  { id: 'name', label: 'Сотрудник', get: (r) => r.employee.name.toLowerCase() },
  { id: 'profile', label: 'Должность', get: (r) => (r.profile?.title || '').toLowerCase() },
  { id: 'bank', label: 'Банк', get: (r) => r.bankCents, numeric: true },
  { id: 'points', label: 'Баллы', get: (r) => r.prizePoints, numeric: true },
  { id: 'level', label: 'Уровень премии', get: (r) => r.currentLevel, numeric: true },
  { id: 'earned', label: 'Заработано', get: (r) => r.earnedCents, numeric: true },
  { id: 'work', label: 'Уровень работы', get: (r) => r.work?.position ?? 0, numeric: true },
]

export function TeamTable({ rows, totals, isCurrent = true, onOpen }) {
  const [sort, setSort] = useState({ id: 'name', dir: 'asc' })

  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.id === sort.id) ?? COLUMNS[0]
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const x = col.get(a)
      const y = col.get(b)
      if (x < y) return -1 * dir
      if (x > y) return 1 * dir
      return a.employee.name.localeCompare(b.employee.name)
    })
  }, [rows, sort])

  const toggle = (id) => setSort((s) => (s.id === id
    ? { id, dir: s.dir === 'asc' ? 'desc' : 'asc' }
    // Числа удобнее смотреть от большего: у кого больше банк, тот сверху.
    : { id, dir: COLUMNS.find((c) => c.id === id)?.numeric ? 'desc' : 'asc' }))

  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState label="Нет сотрудников" text="В отделе пока нет сотрудников, у которых есть банк и баллы." />
      </Card>
    )
  }

  return (
    <Card pad="none" className="overflow-hidden">
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-line">
            {COLUMNS.map((c) => (
              <th key={c.id} className={cx('px-4 py-3 font-medium text-ink-3', c.numeric ? 'text-right' : 'text-left')}>
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  className={cx('inline-flex items-center gap-1 cursor-pointer hover:text-ink', sort.id === c.id && 'text-ink')}
                >
                  {c.label}
                  <span className="text-xs">{sort.id === c.id ? (sort.dir === 'asc' ? '↑' : '↓') : ''}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.employee.id}
              onClick={() => onOpen(r)}
              className="cursor-pointer border-b border-line last:border-b-0 hover:bg-panel-2"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={r.employee.name} email={r.employee.email} src={r.employee.avatarUrl} color={r.employee.avatarColor} size={30} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{r.employee.name}</span>
                    <span className="truncate text-xs text-ink-3">
                      {r.employee.department?.name || 'Без отдела'}
                      {!r.employee.active && ' · отключён'}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-ink-2">{r.profile?.title || <span className="text-warn">Не назначен</span>}</td>
              <td className="px-4 py-3 text-right tabular-nums">{dollars(r.bankCents)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{r.prizePoints}</td>
              <td className="px-4 py-3 text-right tabular-nums">{r.currentLevel ? `${r.currentLevel} из ${r.levelsCount}` : '—'}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">{dollars(r.earnedCents)}</td>
              <td className="px-4 py-3 text-right text-ink-2">{r.work?.title || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col divide-y divide-line md:hidden">
        {sorted.map((r) => (
          <li key={r.employee.id}>
            <button type="button" onClick={() => onOpen(r)} className="flex w-full flex-col gap-3 px-4 py-4 text-left hover:bg-panel-2 cursor-pointer">
              <div className="flex items-center gap-3">
                <Avatar name={r.employee.name} email={r.employee.email} src={r.employee.avatarUrl} color={r.employee.avatarColor} size={32} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{r.employee.name}</span>
                  <span className="truncate text-xs text-ink-3">{r.profile?.title || 'Профиль не назначен'}</span>
                </div>
                <span className="font-semibold tabular-nums">{dollars(r.earnedCents)}</span>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-xs">
                <Stat label="Банк" value={dollars(r.bankCents)} />
                <Stat label="Баллы" value={r.prizePoints} />
                <Stat label="Уровень" value={r.currentLevel ? `${r.currentLevel} из ${r.levelsCount}` : '—'} />
              </dl>
              {r.work && <span className="text-xs text-ink-2">{r.work.title}</span>}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1 border-t border-line bg-panel-2/50 px-4 py-3 text-sm sm:flex-row sm:justify-end sm:gap-8">
        <p className="flex justify-between gap-3 sm:block">
          <span className="text-ink-3">Всего в банках </span>
          <span className="font-semibold tabular-nums">{dollars(totals.bankCents)}</span>
        </p>
        <p className="flex justify-between gap-3 sm:block">
          <span className="text-ink-3">{isCurrent ? 'К выплате сейчас ' : 'К выплате '}</span>
          <span className="font-semibold tabular-nums text-accent">{dollars(totals.payoutCents)}</span>
        </p>
      </div>
    </Card>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-panel-2 px-2 py-1.5">
      <dt className="text-ink-3">{label}</dt>
      <dd className="font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  )
}
