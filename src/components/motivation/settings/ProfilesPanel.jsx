import { useState } from 'react'
import { Badge, Button, Card, ConfirmModal, Input, Modal, Select } from '../../../shared/ui'
import { dayMonth, employeesWord } from '../../../utils/motivation'
import { withPlural } from '../../../shared/lib/plural'

/**
 * Список профилей должностей: создать, скопировать, открыть на правку,
 * удалить. Профилей можно сколько угодно — например, для проджект-менеджера
 * или SMM.
 */
export function ProfilesPanel({ profiles, onOpen, actions }) {
  const [creating, setCreating] = useState(null)
  const [title, setTitle] = useState('')
  const [copyFrom, setCopyFrom] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const openCreate = (source = null) => {
    setCreating(true)
    setCopyFrom(source?.id || '')
    setTitle(source ? `${source.title} (копия)` : '')
    setError(null)
  }

  async function create() {
    if (!title.trim()) { setError('Укажите название'); return }
    setBusy(true)
    const res = await actions.createProfile({ title: title.trim(), copyFromId: copyFrom || undefined })
    setBusy(false)
    if (res.ok) { setCreating(null); onOpen(res.data.id) } else setError(res.error)
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="caption">Профили должностей</p>
          <p className="text-sm text-ink-3">У каждой должности свои события и баллы.</p>
        </div>
        <Button size="sm" onClick={() => openCreate()}>Новый профиль</Button>
      </div>

      <ul className="grid gap-3 md:grid-cols-2">
        {profiles.map((p) => (
          <li key={p.id} className="flex flex-col gap-3 rounded-lg border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-ink-3">Условия обновлены {dayMonth(p.conditionsUpdatedAt)}</p>
              </div>
              {p.customScale && <Badge tone="brand">своя шкала</Badge>}
            </div>
            <p className="text-sm text-ink-2">
              {withPlural(p.events.filter((e) => e.enabled).length, 'событие', 'события', 'событий')} · {p.assignedCount ? employeesWord(p.assignedCount) : 'никому не назначен'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => onOpen(p.id)}>Открыть</Button>
              <Button size="sm" variant="ghost" onClick={() => openCreate(p)}>Копировать</Button>
              {p.assignedCount === 0 && p.eventsCount === 0 && (
                <Button size="sm" variant="ghost" onClick={() => { setDeleting(p); setDeleteError(null) }}>Удалить</Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(creating)}
        onClose={() => setCreating(null)}
        title={copyFrom ? 'Копия профиля' : 'Новый профиль'}
        size="sm"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setCreating(null)}>Отмена</Button>
            <Button loading={busy} onClick={create}>Создать</Button>
          </>
        )}
      >
        <div className="flex flex-col gap-4">
          <Input label="Название" required value={title} onChange={(e) => { setTitle(e.target.value); setError(null) }} error={error} maxLength={80} placeholder="Например, SMM-специалист" />
          <Select
            label="Взять условия из профиля"
            placeholder="Начать с пустого"
            options={profiles.map((p) => ({ value: p.id, label: p.title }))}
            value={copyFrom}
            onChange={(e) => setCopyFrom(e.target.value)}
            hint="Пустой профиль сразу получает событие «Клиент купил дополнительный продукт»"
          />
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        danger
        title={`Удалить профиль «${deleting?.title}»?`}
        text={deleteError || 'Профиль никому не назначался, его можно удалить без последствий.'}
        confirmText="Удалить"
        onConfirm={async () => {
          const res = await actions.deleteProfile(deleting.id)
          if (res.ok) setDeleting(null); else setDeleteError(res.error)
        }}
      />
    </Card>
  )
}
