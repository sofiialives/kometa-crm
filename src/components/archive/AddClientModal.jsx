import { useEffect, useMemo, useState } from 'react'
import { Button, Modal, Select } from '../../shared/ui'

/**
 * Занести клиента в архив. Своего списка клиентов у архива нет — берём
 * тот, что уже ведётся в CRM, ровно как просил заказчик.
 *
 * Архив у каждого отдела свой, поэтому отдел обязателен. Сотруднику он
 * подставляется молча — чужого у него всё равно нет. Админ стоит на вкладке
 * «Все отделы» и должен выбрать: без отдела запись торчала бы пустой
 * карточкой у всех сразу.
 */
export function AddClientModal({ open, onClose, onSubmit, clients, alreadyInArchive, departments, departmentId }) {
  const [clientId, setClientId] = useState('')
  const [dept, setDept] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // Отдел вкладки мог смениться, пока окно было закрыто.
  useEffect(() => { if (open) { setDept(departmentId || ''); setError(null) } }, [open, departmentId])

  const needDept = !departmentId

  // Показываем всех до единого — так попросил заказчик. Он листал список,
  // не находил знакомого клиента (тот был скрыт как уже занесённый) и решал,
  // что база не подтягивается. Лучше пометка, чем пропажа.
  //
  // Выбрать уже занесённого не возбраняется: сервер вернёт ту же карточку,
  // второй записи не появится.
  const available = useMemo(
    () => clients.map((c) => ({
      value: c.id,
      label: alreadyInArchive.has(c.id) ? `${c.name} — уже в архиве` : c.name,
    })),
    [clients, alreadyInArchive],
  )

  async function submit() {
    if (!clientId) return setError('Выберите клиента')
    if (needDept && !dept) return setError('Выберите отдел — архив у каждого свой')
    setBusy(true)
    setError(null)
    const res = await onSubmit(clientId, dept || departmentId)
    setBusy(false)
    if (!res.ok) return setError(res.error)
    setClientId('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Клиент в архив"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} loading={busy} disabled={available.length === 0}>Занести</Button>
        </>
      }
    >
      {available.length === 0 ? (
        <p className="text-sm text-ink-2 leading-relaxed">
          В базе пока нет клиентов. Заведите клиента в CRM — и он появится здесь.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <Select
            label="Клиент"
            required
            placeholder="Выберите из базы клиентов"
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setError(null) }}
            error={needDept ? null : error}
            hint="Помеченные уже лежат в архиве этого отдела — такого можно выбрать, откроется та же карточка"
            options={available}
          />

          {needDept && (
            <Select
              label="В какой отдел"
              required
              placeholder="Выберите отдел"
              value={dept}
              onChange={(e) => { setDept(e.target.value); setError(null) }}
              error={error}
              hint="Архив у каждого отдела свой — клиент попадёт только в выбранный"
              options={(departments || []).map((d) => ({ value: d.id, label: d.name }))}
            />
          )}
        </div>
      )}
    </Modal>
  )
}
