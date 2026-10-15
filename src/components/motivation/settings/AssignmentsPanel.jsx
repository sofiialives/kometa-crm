import { useState } from 'react'
import { Avatar, Card, Select } from '../../../shared/ui'
import { dayMonth } from '../../../utils/motivation'

/**
 * Ручное назначение старых профилей — только для людей, чьему отделу ещё
 * не заданы условия по отделу. Остальным условия достаются сами. Когда
 * условия есть у всех отделов, блок не показывается.
 */
export function AssignmentsPanel({ employees, profiles, onAssign }) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)
  const legacy = profiles.filter((p) => !p.department)
  const options = legacy.map((p) => ({ value: p.id, label: p.title }))
  const covered = new Set(profiles.filter((p) => p.department).map((p) => p.department.id))

  async function change(employee, profileId) {
    if (!profileId || profileId === employee.profileId) return
    setBusyId(employee.id)
    const res = await onAssign(employee.id, profileId)
    setBusyId(null)
    setError(res.ok ? null : res.error)
  }

  const active = employees.filter((e) => e.active && !(e.department && covered.has(e.department.id)))
  if (active.length === 0 || legacy.length === 0) return null

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="caption">Старые профили вручную</p>
        <p className="text-sm text-ink-3">Здесь только люди, чьему отделу ещё не заданы условия выше. Задайте условия отделу, и назначать вручную не придётся.</p>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <ul className="flex flex-col divide-y divide-line">
        {active.map((e) => (
          <li key={e.id} className="grid gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_16rem] sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={e.name} email={e.email} src={e.avatarUrl} color={e.avatarColor} size={30} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">
                  {e.name}
                  {e.role === 'lead' && <span className="ml-2 rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent">руководитель</span>}
                </span>
                <span className="truncate text-xs text-ink-3">
                  {[e.position, e.department?.name].filter(Boolean).join(' · ') || 'Без должности и отдела'}
                  {e.assignedAt ? ` · с ${dayMonth(e.assignedAt)}` : ''}
                </span>
              </div>
            </div>
            <Select
              size="sm"
              placeholder="Профиль не назначен"
              options={options}
              value={e.profileId || ''}
              disabled={busyId === e.id}
              onChange={(ev) => change(e, ev.target.value)}
              aria-label={`Профиль: ${e.name}`}
            />
          </li>
        ))}
      </ul>
    </Card>
  )
}
