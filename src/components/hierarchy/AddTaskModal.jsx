import { useEffect, useState } from 'react'
import { Modal, Button, Input, Textarea, Select } from '../../shared/ui'
import { displayName, membersOf } from '../../utils/admin'
import { buildDeadlineMsk, defaultMskDateValue, defaultMskTimeValue } from '../../utils/tasks'

export function AddTaskModal({ work, currentUser, users, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const isAdmin = currentUser?.role === 'admin'
  // Выбираем из отдела, к которому относится работа, а не только из уже
  // назначенных исполнителей — главный или админ может сходу поставить
  // задачу любому в своём отделе, не заводя его в исполнители заранее.
  const members = work ? membersOf(users, work.departmentId) : []
  const pickable = members.filter((u) => u.id !== currentUser?.id)
  const canPick = pickable.length > 0

  useEffect(() => {
    if (!work) return
    setTitle('')
    setDescription('')
    setDate(defaultMskDateValue())
    setTime(defaultMskTimeValue())
    setOwnerId('')
    setError(null)
  }, [work])

  async function submit() {
    if (!title.trim()) return setError('Укажите название')
    // Админ не состоит ни в одном отделе — самоназначение для него
    // не имеет смысла, сотрудника выбрать обязательно.
    if (isAdmin && !ownerId) return setError('Выберите сотрудника')

    let deadline
    try {
      deadline = buildDeadlineMsk(date, time)
    } catch {
      return setError('Укажите дату и время')
    }

    setSaving(true)
    const res = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      deadline,
      workId: work.id,
      ...(ownerId ? { ownerId } : {}),
    })
    setSaving(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось создать задачу')
  }

  return (
    <Modal
      open={Boolean(work)}
      onClose={onClose}
      title="Задача по работе"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={saving} onClick={submit}>Создать</Button>
        </>
      }
    >
      {!work ? null : (
        <div className="flex flex-col gap-4">
          <p className="mono-caption">{work.clientName} · {work.title}</p>

          <Input
            label="Название"
            required
            placeholder="Например: Собрать референсы"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(null) }}
          />

          <Textarea
            label="Описание"
            rows={3}
            placeholder="Кратко опишите задачу"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Срок, дата"
              required
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setError(null) }}
            />
            <Input
              label="Время, по Москве"
              required
              type="time"
              value={time}
              onChange={(e) => { setTime(e.target.value); setError(null) }}
            />
          </div>

          {canPick ? (
            <Select
              label="Кому"
              required={isAdmin}
              placeholder={isAdmin ? 'Выберите сотрудника' : `Себе${currentUser ? ' · ' + displayName(currentUser) : ''}`}
              value={ownerId}
              onChange={(e) => { setOwnerId(e.target.value); setError(null) }}
              options={pickable.map((u) => ({ value: u.id, label: displayName(u) + (u.position ? ' · ' + u.position : '') }))}
            />
          ) : (
            <p className="text-xs leading-relaxed text-ink-3">
              {isAdmin
                ? 'В этом отделе нет сотрудников — сначала пригласите кого-то.'
                : 'Задача создаётся на вас — в отделе больше никого нет.'}
            </p>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
