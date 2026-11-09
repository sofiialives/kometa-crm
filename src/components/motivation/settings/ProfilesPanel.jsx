import { useState } from 'react'
import { Avatar, Badge, Button, Card, ConfirmModal } from '../../../shared/ui'
import { employeesWord } from '../../../utils/motivation'
import { withPlural } from '../../../shared/lib/plural'

function People({ people, personalIds }) {
  if (!people.length) return <p className="text-xs text-ink-3">В отделе никого с этой ролью</p>
  return (
    <ul className="flex flex-wrap gap-1.5">
      {people.map((u) => {
        const personal = personalIds.has(u.id)
        return (
          <li key={u.id} className="relative">
            <Avatar
              name={u.name}
              email={u.email}
              src={u.avatarUrl}
              color={u.avatarColor}
              size={30}
              title={personal ? `${u.name}, персональные условия` : u.name}
              className={personal ? 'ring-2 ring-accent ring-offset-2 ring-offset-panel' : undefined}
            />
            {personal && <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-panel bg-accent" />}
          </li>
        )
      })}
    </ul>
  )
}

function PartCard({ department, audience, byKey, people, personalIds, busy, onOpen, onCreate, onDelete }) {
  const p = byKey.get(`${department.id}:${audience.value}`)
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{audience.label}</p>
        {!p && <span className="text-xs text-ink-3">условий нет</span>}
      </div>
      <People people={people} personalIds={personalIds} />
      <div className="flex flex-wrap gap-2">
        {p ? (
          <>
            <Button size="sm" variant="secondary" onClick={() => onOpen({ departmentId: department.id, key: audience.value })}>Открыть</Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(p)}>Удалить</Button>
          </>
        ) : (
          <Button size="sm" variant="secondary" loading={busy} onClick={() => onCreate(department, audience.value)}>Задать условия</Button>
        )}
      </div>
    </div>
  )
}

const AUDIENCES = [
  { value: 'staff', label: 'Специалист' },
  { value: 'lead', label: 'Руководитель отдела' },
]

/**
 * Условия по отделам. Отделы берутся из CRM: заведённый в админке отдел
 * сразу появляется здесь. У отдела две части — для специалистов и для
 * руководителя; людям условия достаются сами по их отделу и роли.
 * Руководителю без своей части достаются условия специалистов. Люди с точкой на аватарке работают по персональным условиям.
 *
 * Старые профили без отдела показаны отдельно: никому не назначаются, остались
 * для истории баллов, их можно удалить.
 */
export function ProfilesPanel({ profiles, departments, employees = [], onOpen, actions }) {
  const [createError, setCreateError] = useState(null)
  const [busyKey, setBusyKey] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const byKey = new Map(profiles.filter((p) => p.department && !p.userId).map((p) => [`${p.department.id}:${p.audience}`, p]))
  const personalIds = new Set(profiles.filter((p) => p.userId).map((p) => p.userId))
  // Персональные профили тоже без отдела, но они не старые: их видно по аватарке человека.
  const legacy = profiles.filter((p) => !p.department && !p.userId)

  // «Задать условия» сразу создаёт пустой профиль отдела и открывает его окно.
  async function create(department, audience) {
    setBusyKey(`${department.id}:${audience}`)
    setCreateError(null)
    const res = await actions.createProfile({ departmentId: department.id, audience })
    setBusyKey(null)
    if (res.ok) onOpen({ departmentId: department.id, key: audience }); else setCreateError(res.error)
  }

  const used = (p) => p && (p.assignedCount > 0 || p.eventsCount > 0)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="caption">Условия по отделам</p>
        <p className="text-sm text-ink-3">
          Отделы берутся из CRM, новый отдел из админки появится здесь сам. Людям условия достаются по их отделу и роли, назначать вручную не нужно.
        </p>
      </div>

      {createError && <p className="text-sm text-danger">{createError}</p>}

      <ul className="flex flex-col gap-3">
        {departments.map((d) => (
          <li key={d.id} className="flex flex-col gap-3 rounded-lg border border-line p-4">
            <p className="font-semibold">{d.name}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {AUDIENCES.map((a) => (
                <PartCard
                  key={a.value}
                  department={d}
                  audience={a}
                  byKey={byKey}
                  onOpen={onOpen}
                  people={employees.filter((e) => e.active && e.department?.id === d.id && e.role === a.value)}
                  personalIds={personalIds}
                  busy={busyKey === `${d.id}:${a.value}`}
                  onCreate={create}
                  onDelete={(p) => { setDeleting(p); setDeleteError(null) }}
                />
              ))}
            </div>
          </li>
        ))}
        {departments.length === 0 && <p className="text-sm text-ink-3">В CRM пока нет отделов. Заведите их в админке.</p>}
      </ul>

      {legacy.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">Старые профили без отдела</p>
            <p className="text-sm text-ink-3">
              Больше никому не назначаются: условия людям берутся только по отделу и роли. Эти профили остались для истории баллов, их можно удалить.
            </p>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {legacy.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold">{p.title}</p>
                  {p.customScale && <Badge tone="brand">своя шкала</Badge>}
                </div>
                <p className="text-sm text-ink-2">
                  {withPlural(p.events.filter((e) => e.enabled).length, 'событие', 'события', 'событий')} · {p.assignedCount ? employeesWord(p.assignedCount) : 'никому не назначен'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onOpen({ profileId: p.id })}>Открыть</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setDeleting(p); setDeleteError(null) }}>Удалить</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        danger
        title={`Удалить «${deleting?.title}»?`}
        text={deleteError || (used(deleting)
          ? 'По этим условиям уже работали люди. История их баллов останется, а сами условия больше никому не назначаются.'
          : 'Условия никто не использовал, они удалятся без следа.')}
        confirmText="Удалить"
        onConfirm={async () => {
          const res = await actions.deleteProfile(deleting.id)
          if (res.ok) setDeleting(null); else setDeleteError(res.error)
        }}
      />
    </Card>
  )
}
