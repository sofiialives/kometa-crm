import { useEffect, useState } from 'react'
import { Modal, Button, Checkbox, EmptyState } from '../../shared/ui'
import { displayName, membersOf } from '../../utils/admin'

export function AssigneesModal({ work, users, onClose, onSubmit }) {
  const [selected, setSelected] = useState([])
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const members = work ? membersOf(users, work.departmentId) : []

  // Отмечаем только тех, кто сейчас в отделе: переведённый или уволенный
  // исполнитель иначе остался бы в работе невидимым для админа.
  useEffect(() => {
    if (!work) return
    const ids = new Set(membersOf(users, work.departmentId).map((u) => u.id))
    setSelected((work.assignees || []).map((u) => u.id).filter((id) => ids.has(id)))
    setError(null)
  }, [work, users])

  function toggle(id) {
    setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  }

  async function submit() {
    setSaving(true)
    const res = await onSubmit(work, selected)
    setSaving(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось сохранить')
  }

  return (
    <Modal
      open={Boolean(work)}
      onClose={onClose}
      title="Исполнители работы"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button
            loading={saving}
            disabled={members.length === 0 && (work?.assignees?.length || 0) === 0}
            onClick={submit}
          >
            Сохранить
          </Button>
        </>
      }
    >
      {!work ? null : members.length === 0 ? (
        <EmptyState label="Никого нет" text="В отделе нет активных сотрудников." />
      ) : (
        <div className="flex flex-col gap-3">
          {members.map((u) => (
            <Checkbox
              key={u.id}
              label={displayName(u) + (u.position ? ' · ' + u.position : '')}
              checked={selected.includes(u.id)}
              onChange={() => toggle(u.id)}
            />
          ))}
          {error && <p className="text-[13px] text-danger">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
