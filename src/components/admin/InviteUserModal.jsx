import { useEffect, useState } from 'react'
import { Modal, Button, Input, Select } from '../../shared/ui'
import { ROLES } from '../../utils/admin'

export function InviteUserModal({ open, onClose, departments, defaultDepartmentId, onSubmit }) {
  const [email, setEmail] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [role, setRole] = useState('staff')
  const [picked, setPicked] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setEmail('')
    setDepartmentId(defaultDepartmentId || departments[0]?.id || '')
    setRole('staff')
    setPicked('')
    setError(null)
  }, [open, departments, defaultDepartmentId])

  const department = departments.find((d) => d.id === departmentId) || null
  const positions = department?.positions || []
  const position = positions.includes(picked) ? picked : positions[0] || ''

  // Главному должность ставит сам бэк — «Начальник отдела», выбирать нечего.
  const needsPosition = role !== 'lead'
  const noPositions = needsPosition && department && positions.length === 0

  async function submit() {
    if (!email.trim()) return setError('Укажите почту')
    if (!departmentId) return setError('Выберите отдел')
    if (needsPosition && !position) return setError('Выберите должность')

    setSaving(true)
    const res = await onSubmit({
      email: email.trim().toLowerCase(),
      departmentId,
      role,
      ...(needsPosition ? { position } : {}),
    })
    setSaving(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось пригласить')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новый сотрудник"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={saving} disabled={noPositions || departments.length === 0} onClick={submit}>Пригласить</Button>
        </>
      }
    >
      {departments.length === 0 ? (
        <p className="text-sm leading-relaxed text-ink-2">
          Сначала создайте хотя бы один отдел — приглашать без отдела нельзя.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <Input
            label="Почта"
            required
            type="email"
            placeholder="ivan@kometa.web3"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null) }}
          />

          <Select
            label="Отдел"
            required
            value={departmentId}
            onChange={(e) => { setDepartmentId(e.target.value); setError(null) }}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />

          <Select
            label="Роль"
            required
            value={role}
            onChange={(e) => { setRole(e.target.value); setError(null) }}
            options={ROLES}
          />

          {needsPosition ? (
            <Select
              label="Должность"
              required
              value={position}
              onChange={(e) => { setPicked(e.target.value); setError(null) }}
              options={positions.map((p) => ({ value: p, label: p }))}
              placeholder={positions.length ? undefined : 'В отделе нет должностей'}
              disabled={positions.length === 0}
              error={noPositions ? 'В этом отделе не заведено ни одной должности' : undefined}
            />
          ) : (
            <p className="rounded-xl border border-line bg-surface-3 px-4 py-3 text-sm text-ink-3">
              Должность главного проставится автоматически — «Начальник отдела».
            </p>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <p className="text-xs leading-relaxed text-ink-3">
            Письмо не отправляется. Сотрудник заходит по этой почте и сам задаёт пароль при первом входе.
          </p>
        </div>
      )}
    </Modal>
  )
}
