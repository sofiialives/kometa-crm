import { useState } from 'react'
import { useAuthStore } from '../../core/store/authStore'
import { Modal, Input, Button } from '../ui'

/**
 * Сразу после первого входа в имени лежит только первая буква почты —
 * этим не отличить сотрудников друг от друга ни в списках, ни на
 * аватарках. Модалка блокирующая (без крестика и клика по фону) —
 * пропустить нельзя, имя нужно ввести один раз и дальше не спросится.
 */
function needsName(user) {
  return Boolean(user) && (user.name || '').trim().length <= 1
}

export function NameGate() {
  const user = useAuthStore((s) => s.user)
  const updateName = useAuthStore((s) => s.updateName)
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  if (!needsName(user)) return null

  async function submit(e) {
    e.preventDefault()
    if (name.trim().length < 2) return setError('Введите имя полностью')
    setSaving(true)
    const res = await updateName(name.trim())
    setSaving(false)
    if (!res.ok) setError(res.error)
  }

  return (
    <Modal open title="Как вас зовут?" size="sm" closeOnOverlay={false} onClose={() => {}} hideClose>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-ink-2">
          Это имя увидят коллеги — на аватарке, в списках отделов и в задачах.
        </p>
        <Input
          label="Имя и фамилия"
          placeholder="Например: Мария Смирнова"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null) }}
          autoFocus
          error={error}
        />
        <Button type="submit" loading={saving} full>Сохранить</Button>
      </form>
    </Modal>
  )
}
