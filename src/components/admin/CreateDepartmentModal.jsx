import { useEffect, useState } from 'react'
import { Modal, Button, Input } from '../../shared/ui'

export function CreateDepartmentModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [draft, setDraft] = useState('')
  const [positions, setPositions] = useState([])
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setDraft('')
    setPositions([])
    setError(null)
  }, [open])

  function addPosition() {
    const value = draft.trim()
    if (!value) return
    if (positions.includes(value)) {
      setDraft('')
      return
    }
    setPositions((list) => [...list, value])
    setDraft('')
  }

  async function submit() {
    if (name.trim().length < 2) {
      setError('Название минимум два символа')
      return
    }
    setSaving(true)
    const res = await onSubmit({ name: name.trim(), positions })
    setSaving(false)
    if (res?.ok) onClose()
    else setError(res?.error || 'Не удалось создать отдел')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новый отдел"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button loading={saving} onClick={submit}>Создать</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Название отдела"
          required
          placeholder="Например: Дизайн"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null) }}
          error={error}
        />

        <div className="flex flex-col gap-2">
          <span className="mono-caption select-none">Должности в отделе</span>
          <div className="flex gap-2">
            <Input
              placeholder="Например: Дизайнер"
              className="flex-1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addPosition() }
              }}
            />
            <Button variant="secondary" onClick={addPosition} className="h-11 shrink-0">Добавить</Button>
          </div>
          <p className="text-xs leading-snug text-ink-3">
            Без должностей в отдел нельзя пригласить сотрудника
          </p>

          {positions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {positions.map((p) => (
                <span key={p} className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-sm">
                  {p}
                  <button
                    onClick={() => setPositions((list) => list.filter((x) => x !== p))}
                    className="text-ink-3 transition-colors hover:text-danger cursor-pointer"
                    aria-label={'Убрать ' + p}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
