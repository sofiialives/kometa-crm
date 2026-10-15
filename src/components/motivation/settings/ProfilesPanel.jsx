import { useState } from 'react'
import { Badge, Button, Card, ConfirmModal, Modal, Select } from '../../../shared/ui'
import { dayMonth, employeesWord } from '../../../utils/motivation'
import { withPlural } from '../../../shared/lib/plural'

const AUDIENCES = [
  { value: 'staff', label: 'Специалист' },
  { value: 'lead', label: 'Руководитель отдела' },
]

/**
 * Условия по отделам. Отделы берутся из CRM: заведённый в админке отдел
 * сразу появляется здесь. У отдела две части — для специалистов и для
 * руководителя; людям условия достаются сами по их отделу и роли.
 * Руководителю без своей части достаются условия специалистов.
 *
 * Старые профили без отдела показаны отдельно: по ним люди работают, пока
 * их отделу не заданы условия здесь.
 */
export function ProfilesPanel({ profiles, departments, onOpen, actions }) {
  const [creating, setCreating] = useState(null)
  const [copyFrom, setCopyFrom] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const byKey = new Map(profiles.filter((p) => p.department).map((p) => [`${p.department.id}:${p.audience}`, p]))
  const legacy = profiles.filter((p) => !p.department)

  const openCreate = (department, audience) => {
    setCreating({ department, audience })
    setCopyFrom('')
    setError(null)
  }

  async function create() {
    setBusy(true)
    const res = await actions.createProfile({
      departmentId: creating.department.id,
      audience: creating.audience,
      copyFromId: copyFrom || undefined,
    })
    setBusy(false)
    if (res.ok) { setCreating(null); onOpen(res.data.id) } else setError(res.error)
  }

  const used = (p) => p && (p.assignedCount > 0 || p.eventsCount > 0)

  function Part({ department, audience }) {
    const p = byKey.get(`${department.id}:${audience.value}`)
    const fallback = audience.value === 'lead' && !p && byKey.get(`${department.id}:staff`)
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-line p-3">
        <p className="text-sm font-semibold">{audience.label}</p>
        {p ? (
          <>
            <p className="text-sm text-ink-2">
              {withPlural(p.events.filter((e) => e.enabled).length, 'событие', 'события', 'событий')} · {p.assignedCount ? employeesWord(p.assignedCount) : 'пока никого'}
            </p>
            <p className="text-xs text-ink-3">Условия обновлены {dayMonth(p.conditionsUpdatedAt)}{p.customScale ? ' · своя шкала' : ''}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => onOpen(p.id)}>Открыть</Button>
              <Button size="sm" variant="ghost" onClick={() => { setDeleting(p); setDeleteError(null) }}>Удалить</Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-3">
              {fallback ? 'Не заданы. Руководитель работает по условиям специалистов.' : 'Условия не заданы.'}
            </p>
            <div>
              <Button size="sm" variant="secondary" onClick={() => openCreate(department, audience.value)}>Задать условия</Button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="caption">Условия по отделам</p>
        <p className="text-sm text-ink-3">
          Отделы берутся из CRM, новый отдел из админки появится здесь сам. Людям условия достаются по их отделу и роли, назначать вручную не нужно.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {departments.map((d) => (
          <li key={d.id} className="flex flex-col gap-3 rounded-lg border border-line p-4">
            <p className="font-semibold">{d.name}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {AUDIENCES.map((a) => <Part key={a.value} department={d} audience={a} />)}
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
              По ним работают люди, чьему отделу ещё не заданы условия выше. Когда зададите условия отделу, людям они достанутся сами, а старый профиль можно удалить.
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
                  <Button size="sm" variant="secondary" onClick={() => onOpen(p.id)}>Открыть</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setDeleting(p); setDeleteError(null) }}>Удалить</Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={Boolean(creating)}
        onClose={() => setCreating(null)}
        title={creating ? `${creating.department.name}: ${AUDIENCES.find((a) => a.value === creating.audience)?.label.toLowerCase()}` : ''}
        size="sm"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setCreating(null)}>Отмена</Button>
            <Button loading={busy} onClick={create}>Задать условия</Button>
          </>
        )}
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Взять условия из профиля"
            placeholder="Начать с пустого"
            options={profiles.map((p) => ({ value: p.id, label: p.title }))}
            value={copyFrom}
            onChange={(e) => { setCopyFrom(e.target.value); setError(null) }}
            hint="Можно скопировать события и шкалу из старого профиля или другого отдела. Пустые условия сразу получают звонок, чек-ин и покупку продукта"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </Modal>

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
