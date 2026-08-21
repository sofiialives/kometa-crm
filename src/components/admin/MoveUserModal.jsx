import { useEffect, useState } from 'react'
import { Modal, Button, Select } from '../../shared/ui'
import { displayName } from '../../utils/admin'

export function MoveUserModal({ user, departments, onClose, onSubmit }) {
  const [departmentId, setDepartmentId] = useState('')
  const [picked, setPicked] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Свой отдел из списка не убираем: этой же модалкой правят должность внутри
  // отдела — после понижения из главных её больше негде задать.
  useEffect(() => {
    if (!user) return
    setDepartmentId(user.departmentId || '')
    setPicked(user.position || '')
    setError(null)
  }, [user])

  const target = departments.find((d) => d.id === departmentId) || null
  const positions = target?.positions || []
  // Выбранная должность живёт только пока она есть в отделе: сменили отдел —
  // подставляем первую из его списка, а не тащим чужую.
  const position = positions.includes(picked) ? picked : positions[0] || ''

  const isLead = Boolean(user && departments.some((d) => d.leadId === user.id))
  // Руководство привязано к отделу: уходит в другой — перестаёт быть главным
  // и получает обычную должность нового отдела.
  const leavingAsLead = isLead && departmentId !== user.departmentId
  // Пока остаётся главным, должность у него служебная — её не выбирают.
  const keepsPosition = isLead && !leavingAsLead

  async function submit() {
    if (!departmentId) return setError('Выберите отдел')
    if (!keepsPosition && !position) return setError('В этом отделе нет должностей')

    setSaving(true)
    const res = await onSubmit(user, {
      departmentId,
      position: keepsPosition ? undefined : position,
    })
    setSaving(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось сохранить')
  }

  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      title="Отдел и должность"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={saving} disabled={!keepsPosition && !positions.length} onClick={submit}>
            Сохранить
          </Button>
        </>
      }
    >
      {!user ? null : departments.length === 0 ? (
        <p className="text-sm text-ink-2">Отделов пока нет.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-2">
            Сотрудник <span className="font-medium text-ink">{displayName(user)}</span>
          </p>

          <Select
            label="Отдел"
            required
            value={departmentId}
            onChange={(e) => { setDepartmentId(e.target.value); setError(null) }}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
          />

          {keepsPosition ? (
            <div className="flex flex-col gap-2">
              <span className="mono-caption select-none">Должность</span>
              <p className="rounded-xl border border-line bg-surface-3 px-4 py-3 text-[13px] text-ink-3">
                {user.position || 'Начальник отдела'} — должность главного отдела, она не выбирается.
              </p>
            </div>
          ) : (
            <Select
              label="Должность"
              required
              value={position}
              onChange={(e) => { setPicked(e.target.value); setError(null) }}
              options={positions.map((p) => ({ value: p, label: p }))}
              disabled={positions.length === 0}
              error={positions.length === 0 ? 'В этом отделе не заведено ни одной должности' : undefined}
            />
          )}

          {leavingAsLead && (
            <p className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-[13px] leading-relaxed text-warn">
              Сотрудник сейчас главный отдела. После перевода он перестанет им быть, отдел останется без главного.
            </p>
          )}

          {error && <p className="text-[13px] text-danger">{error}</p>}
        </div>
      )}
    </Modal>
  )
}
