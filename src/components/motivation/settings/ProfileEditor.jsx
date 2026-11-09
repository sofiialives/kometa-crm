import { useEffect, useState } from 'react'
import { Badge, Button, Checkbox, ConfirmModal, Modal, Select, Textarea } from '../../../shared/ui'
import { cx } from '../../../shared/lib/cx'
import { ScaleEditor } from './ScaleEditor'
import { EventTypeModal } from './EventTypeModal'
import { autoRuleLabel, eventPoints, lowerFirst, pointsTone } from '../../../utils/motivation'

/**
 * Окно условий отдела. Сверху выбор, чьи условия правим: отдел по умолчанию,
 * руководитель или конкретный человек. Человек без персональных условий
 * работает по условиям отдела, персональные создаются кнопкой.
 *
 * Каждый блок сохраняется отдельно: правка события уходит на сервер сразу.
 */
export function ProfileEditor({ opened, profiles, department, employees, globalScale, workLevels, onClose, actions }) {
  const [key, setKey] = useState(opened.key || 'staff')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const legacy = opened.profileId ? profiles.find((p) => p.id === opened.profileId) || null : null
  const deptId = department?.id
  const deptProfile = (audience) => profiles.find((p) => !p.userId && p.department?.id === deptId && p.audience === audience) || null
  const people = employees.filter((e) => e.active && e.department?.id === deptId)
  const person = key.startsWith('u:') ? people.find((e) => e.id === key.slice(2)) || null : null

  let profile = null
  let base = null
  if (legacy) profile = legacy
  else if (person) {
    profile = profiles.find((p) => p.userId === person.id) || null
    base = person.role === 'lead' ? deptProfile('lead') || deptProfile('staff') : deptProfile('staff')
  } else profile = deptProfile(key)

  const options = [
    { value: 'staff', label: `${department?.name || 'Отдел'}, всем по умолчанию` },
    { value: 'lead', label: 'Руководитель отдела' },
    ...people.map((e) => ({ value: `u:${e.id}`, label: e.name })),
  ]

  async function create(body) {
    setBusy(true)
    setError(null)
    const res = await actions.createProfile({ departmentId: deptId, ...body })
    setBusy(false)
    if (!res.ok) setError(res.error)
  }

  async function removePersonal() {
    const res = await actions.deleteProfile(profile.id)
    if (res.ok) setConfirmReset(false); else setError(res.error)
    return res
  }

  return (
    <Modal open onClose={onClose} title={legacy ? `Профиль «${legacy.title}»` : `Условия: ${department?.name || 'отдел'}`} size="lg">
      <div className="flex flex-col gap-6">
        {!legacy && (
          <div className="flex flex-col gap-2">
            <Select label="Чьи условия правим" options={options} value={key} onChange={(e) => { setKey(e.target.value); setError(null) }} />
            {profile?.userId && (
              <div>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)}>Убрать персональные, вернуть условия отдела</Button>
              </div>
            )}
          </div>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}

        {profile ? (
          <ProfileBody key={profile.id} profile={profile} globalScale={globalScale} workLevels={workLevels} actions={actions} />
        ) : person ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-line p-4">
            <p className="text-sm font-medium">Работает по условиям отдела</p>
            <p className="text-sm text-ink-3">
              {base ? 'Чтобы изменить условия только для этого человека, задайте персональные. Сначала в них скопируются текущие условия отдела.' : 'У отдела пока нет условий. Сначала задайте их.'}
            </p>
            {base && (
              <Button loading={busy} onClick={() => create({ audience: person.role, userId: person.id, copyFromId: base.id })}>Задать персональные условия</Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-line p-4">
            <p className="text-sm font-medium">Условий нет</p>
            {key === 'lead' && <p className="text-sm text-ink-3">Руководитель работает по условиям специалистов.</p>}
            <Button loading={busy} onClick={() => create({ audience: key })}>Задать условия</Button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        danger
        title="Убрать персональные условия?"
        text={`${person?.name || 'Сотрудник'} снова будет работать по условиям отдела. Начисленные баллы останутся.`}
        confirmText="Убрать"
        onConfirm={removePersonal}
      />
    </Modal>
  )
}

function ProfileBody({ profile, globalScale, workLevels, actions }) {
  const [hints, setHints] = useState({})
  const [eventModal, setEventModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(null)

  // Подсказки сбрасываются, только когда на сервере поменялись именно они:
  // иначе сохранение галочки шкалы стирало бы набранный, но не сохранённый текст.
  const hintsKey = JSON.stringify(profile?.workHints || {})
  useEffect(() => { setHints(profile.workHints || {}) }, [hintsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  async function run(key, fn, okText) {
    setBusy(key)
    const res = await fn()
    setBusy(null)
    setMessage(res?.ok ? { tone: 'ok', text: okText } : { tone: 'danger', text: res?.error || 'Не сохранилось' })
    return res
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6">
          {message && (
            <p className={cx('text-sm', message.tone === 'ok' ? 'text-ok' : 'text-danger')}>{message.text}</p>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="caption">События и баллы</p>
              <Button size="sm" variant="secondary" onClick={() => setEventModal({ event: null })}>Добавить событие</Button>
            </div>
            <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
              {profile.events.map((e) => (
                <li key={e.id} className={cx('flex flex-wrap items-center gap-3 px-3 py-2.5', !e.enabled && 'opacity-55')}>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm font-medium leading-snug">{e.title}</p>
                    <p className="text-xs text-ink-3">
                      {e.mode === 'auto' ? `Автоматически: ${lowerFirst(autoRuleLabel(e.autoRule))}, ${e.review ? 'вам на решение' : 'начисляется сразу'}` : e.systemKey === 'call_attended' || e.systemKey === 'call_missed' ? 'Журнал звонка, владелец' : e.systemKey === 'checkin_missed' ? 'Бот, внезапный чек-ин' : 'Вручную, владелец'}
                    </p>
                  </div>
                  {!e.enabled && <Badge>выключено</Badge>}
                  <span className={cx('text-sm font-semibold tabular-nums', pointsTone(e.prizePoints || e.levelPoints))}>{eventPoints(e)}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEventModal({ event: e })}>Изменить</Button>
                    {!['client_product', 'call_attended', 'call_missed', 'checkin_missed'].includes(e.systemKey) && (
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(e)}>Удалить</Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <p className="caption">Шкала премии</p>
            <Checkbox
              label="Своя шкала для этого профиля вместо общей"
              checked={profile.customScale}
              onChange={(e) => run('custom', () => actions.updateProfile(profile.id, { customScale: e.target.checked }), e.target.checked ? 'Профиль считается по своей шкале' : 'Профиль считается по общей шкале')}
            />
            {profile.customScale || profile.scale.length === 0 ? null : (
              <p className="text-xs text-ink-3">Своя шкала сохранена, но выключена — профиль считается по общей.</p>
            )}
            <ScaleEditor
              levels={profile.scale.length ? profile.scale : globalScale}
              saveLabel={profile.scale.length ? 'Сохранить свою шкалу' : 'Создать свою шкалу'}
              onSave={(levels) => actions.saveProfileScale(profile.id, levels)}
            />
          </section>

          <section className="flex flex-col gap-3">
            <p className="caption">Подсказки к уровням работы</p>
            <p className="text-xs text-ink-3">Пусто — сотрудник увидит общую подсказку, она показана серым.</p>
            {workLevels.map((l) => (
              <Textarea
                key={l.position}
                label={l.title}
                rows={2}
                placeholder={l.hint}
                value={hints[String(l.position)] || ''}
                onChange={(e) => setHints((h) => ({ ...h, [String(l.position)]: e.target.value }))}
                maxLength={500}
              />
            ))}
            <div>
              <Button size="sm" loading={busy === 'hints'} onClick={() => run('hints', () => actions.updateProfile(profile.id, { workHints: hints }), 'Подсказки сохранены')}>
                Сохранить подсказки
              </Button>
            </div>
          </section>
        </div>
      </div>

      {eventModal && (
        <EventTypeModal
          key={eventModal.event?.id ?? 'new'}
          open
          event={eventModal.event}
          onClose={() => setEventModal(null)}
          onSubmit={(body) => (eventModal?.event
            ? actions.updateEventType(eventModal.event.id, body)
            : actions.createEventType(profile.id, body))}
        />
      )}

      <ConfirmModal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        danger
        title="Удалить событие?"
        text="Начисленные по нему баллы останутся в истории сотрудников. Новых начислений по этому событию больше не будет. Если событие может пригодиться, его лучше выключить."
        confirmText="Удалить"
        onConfirm={async () => {
          const res = await actions.deleteEventType(confirmDelete.id)
          setConfirmDelete(null)
          if (!res.ok) setMessage({ tone: 'danger', text: res.error })
        }}
      />
    </>
  )
}
