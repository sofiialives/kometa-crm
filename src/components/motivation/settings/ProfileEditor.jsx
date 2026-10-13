import { useEffect, useState } from 'react'
import { Badge, Button, Checkbox, ConfirmModal, Input, Modal, MoneyInput, Textarea } from '../../../shared/ui'
import { cx } from '../../../shared/lib/cx'
import { ScaleEditor } from './ScaleEditor'
import { EventTypeModal } from './EventTypeModal'
import { MAX_DOLLARS, autoRuleLabel, eventPoints, lowerFirst, pointsTone } from '../../../utils/motivation'

/**
 * Профиль должности целиком: название, стартовая сумма банка, события,
 * своя шкала премии и свои подсказки к уровням работы. Всё, что в задании
 * перечислено в «Что входит в профиль».
 *
 * Каждый блок сохраняется отдельно. Одна общая кнопка «Сохранить» на всё
 * окно путала бы: правка события уже ушла на сервер, а название ещё нет.
 */
export function ProfileEditor({ profile, globalScale, workLevels, onClose, actions }) {
  const [title, setTitle] = useState('')
  const [startBank, setStartBank] = useState('')
  const [hints, setHints] = useState({})
  const [eventModal, setEventModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(null)

  // Каждое поле сбрасывается, только когда на сервере поменялось именно оно.
  // Сохранение названия или галочки шкалы перезапрашивает профиль целиком, и
  // раньше вместе с ним пропадали набранные, но не сохранённые подсказки.
  useEffect(() => { if (profile) setTitle(profile.title) }, [profile?.title]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (profile) setStartBank(profile.startBankCents ? String(profile.startBankCents / 100) : '')
  }, [profile?.startBankCents]) // eslint-disable-line react-hooks/exhaustive-deps
  const hintsKey = JSON.stringify(profile?.workHints || {})
  useEffect(() => { if (profile) setHints(profile.workHints || {}) }, [hintsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return null

  async function run(key, fn, okText) {
    setBusy(key)
    const res = await fn()
    setBusy(null)
    setMessage(res?.ok ? { tone: 'ok', text: okText } : { tone: 'danger', text: res?.error || 'Не сохранилось' })
    return res
  }

  return (
    <>
      <Modal open onClose={onClose} title={`Профиль «${profile.title}»`} size="lg">
        <div className="flex flex-col gap-6">
          {message && (
            <p className={cx('text-sm', message.tone === 'ok' ? 'text-ok' : 'text-danger')}>{message.text}</p>
          )}

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-end gap-2">
              <Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className="flex-1" />
              <Button
                variant="secondary"
                loading={busy === 'title'}
                disabled={!title.trim() || title.trim() === profile.title}
                onClick={() => run('title', () => actions.updateProfile(profile.id, { title: title.trim() }), 'Название сохранено')}
              >
                Сохранить
              </Button>
            </div>
            <div className="flex items-end gap-2">
              <MoneyInput
                label="Стартовая сумма банка"
                value={startBank}
                onChange={setStartBank}
                className="flex-1"
              />
              <Button
                variant="secondary"
                loading={busy === 'bank'}
                onClick={() => {
                  if (!Number.isInteger(Number(startBank || 0))) {
                    setMessage({ tone: 'danger', text: 'Стартовая сумма — целое число долларов' })
                    return
                  }
                  if (Number(startBank || 0) > MAX_DOLLARS) {
                    setMessage({ tone: 'danger', text: 'Стартовая сумма — не больше 1 000 000 $' })
                    return
                  }
                  run('bank', () => actions.updateProfile(profile.id, { startBank: Number(startBank || 0) }), 'Стартовая сумма сохранена')
                }}
              >
                Сохранить
              </Button>
            </div>
            {/* Подсказка отдельной строкой, а не под полем: под полем она
                опускала одно поле ниже соседнего. */}
            <p className="text-xs text-ink-3 sm:col-span-2">
              Стартовая сумма кладётся в банк первого числа каждого месяца. Если поменять её в середине месяца, сразу она ляжет только тем, кому в этом месяце ещё ничего не пополняли, остальным — с 1 числа. Пусто — ноль.
            </p>
          </section>

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
                      {e.mode === 'auto' ? `Автоматически: ${lowerFirst(autoRuleLabel(e.autoRule))}` : e.systemKey === 'call_attended' || e.systemKey === 'call_missed' ? 'Журнал звонка, владелец' : e.systemKey === 'checkin_missed' ? 'Бот, внезапный чек-ин' : 'Вручную, владелец'}
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
      </Modal>

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
