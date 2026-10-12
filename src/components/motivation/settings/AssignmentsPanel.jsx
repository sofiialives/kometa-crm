import { useState } from 'react'
import { Avatar, Card, Select } from '../../../shared/ui'
import { dayMonth } from '../../../utils/motivation'

/**
 * Назначение профилей: у каждого сотрудника ровно один профиль. Смена
 * профиля действует с этого момента — события до неё остаются посчитаны
 * по прежним условиям.
 */
export function AssignmentsPanel({ employees, profiles, onAssign }) {
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)
  const options = profiles.map((p) => ({ value: p.id, label: p.title }))

  async function change(employee, profileId) {
    if (!profileId || profileId === employee.profileId) return
    setBusyId(employee.id)
    const res = await onAssign(employee.id, profileId)
    setBusyId(null)
    setError(res.ok ? null : res.error)
  }

  const active = employees.filter((e) => e.active)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="caption">Назначение профилей</p>
        <p className="text-sm text-ink-3">Банк и баллы есть только у сотрудников — руководители и админ сюда не входят.</p>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <ul className="flex flex-col divide-y divide-line">
        {active.map((e) => (
          <li key={e.id} className="grid gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_16rem] sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={e.name} email={e.email} src={e.avatarUrl} color={e.avatarColor} size={30} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{e.name}</span>
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
