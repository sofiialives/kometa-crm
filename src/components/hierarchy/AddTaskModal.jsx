import { useEffect, useState } from 'react'
import { Modal, Button, Input, Textarea, Checkbox, Avatar, PriorityPicker } from '../../shared/ui'
import { displayName, membersOf } from '../../utils/admin'
import { buildDeadlineMsk, defaultMskDateValue, defaultMskTimeValue } from '../../utils/tasks'

export function AddTaskModal({ work, currentUser, users, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [ownerIds, setOwnerIds] = useState([])
  const [priority, setPriority] = useState('medium')
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
    setOwnerIds([])
    setPriority('medium')
    setError(null)
  }, [work])

  function toggleOwner(id) {
    setError(null)
    setOwnerIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function submit() {
    if (!title.trim()) return setError('Укажите название')
    // Админ не состоит ни в одном отделе — самоназначение для него
    // не имеет смысла, хотя бы одного сотрудника выбрать обязательно.
    if (isAdmin && ownerIds.length === 0) return setError('Выберите хотя бы одного сотрудника')

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
      priority,
      workId: work.id,
      ...(ownerIds.length > 0 ? { ownerIds } : {}),
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
          <p className="caption">{work.clientName} · {work.title}</p>

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

          <PriorityPicker value={priority} onChange={setPriority} />

          {canPick ? (
            <div>
              <p className="caption mb-1.5">
                Кому {!isAdmin && <span className="text-ink-3">— никого не выбрано = себе ({displayName(currentUser)})</span>}
              </p>
              <div className="flex max-h-52 flex-col gap-1 overflow-y-auto rounded-lg border border-line p-2">
                {pickable.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-panel-2"
                  >
                    <Checkbox checked={ownerIds.includes(u.id)} onChange={() => toggleOwner(u.id)} />
                    <Avatar name={displayName(u)} src={u.avatarUrl} color={u.avatarColor} size={22} />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {displayName(u)}
                      {u.position && <span className="text-ink-3"> · {u.position}</span>}
                    </span>
                  </div>
                ))}
              </div>
              {ownerIds.length > 1 && (
                <p className="caption mt-1.5">Каждому создастся своя отдельная задача — {ownerIds.length} шт.</p>
              )}
            </div>
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
