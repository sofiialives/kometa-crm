import { useCallback, useEffect, useRef, useState } from 'react'
import { Avatar, Button, Modal, Spinner } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { MotivationView } from './MotivationView'
import { ConditionsView } from './ConditionsView'
import { MonthSelect } from './MonthSelect'
import { CancelEventModal } from './CancelEventModal'
import { WriteOffModal } from './WriteOffModal'
import { useMotivationStore } from '../../core/store/motivationStore'

/**
 * Сотрудник глазами руководителя: его «Моя мотивация» и «Мои условия» в
 * режиме просмотра, как в задании. Отсюда же — быстрые действия по этому
 * человеку: пополнить банк, добавить баллы, отменить событие, а админу ещё
 * и списать из банка.
 */
export function EmployeeModal({ employeeId, month, refreshKey, onClose, onTopUp, onAddPoints, onChanged }) {
  const fetchEmployee = useMotivationStore((s) => s.fetchEmployee)
  const fetchEmployeeConditions = useMotivationStore((s) => s.fetchEmployeeConditions)
  const cancelEvent = useMotivationStore((s) => s.cancelEvent)
  const writeOff = useMotivationStore((s) => s.writeOff)

  // Окно монтируется заново на каждого сотрудника (родитель задаёт key),
  // поэтому месяц берётся сразу из таблицы, без второго запроса.
  const [tab, setTab] = useState('motivation')
  const [viewMonth, setViewMonth] = useState(month)
  const [data, setData] = useState(null)
  const [conditions, setConditions] = useState(null)
  const [error, setError] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [writeOffOpen, setWriteOffOpen] = useState(false)

  const open = Boolean(employeeId)

  // Номер последнего запроса: ответ, пришедший после закрытия окна или
  // после переключения месяца, не должен затереть свежие данные.
  const latest = useRef(0)
  useEffect(() => () => { latest.current += 1 }, [])

  const load = useCallback(async () => {
    if (!employeeId) return
    const n = ++latest.current
    setError(null)
    const [m, c] = await Promise.all([fetchEmployee(employeeId, viewMonth), fetchEmployeeConditions(employeeId)])
    if (n !== latest.current) return
    if (m.ok) setData(m.data); else setError(m.error)
    if (c.ok) setConditions(c.data)
  }, [employeeId, viewMonth, fetchEmployee, fetchEmployeeConditions])

  // refreshKey меняет страница после действий в своих окнах (пополнение,
  // баллы): карточка поверх таблицы должна показать новые цифры сразу.
  useEffect(() => { load() }, [load, refreshKey])

  async function afterChange() {
    await load()
    onChanged?.()
  }

  const employee = data?.employee
  const canManage = data?.permissions?.canManage

  return (
    <>
      <Modal open={open} onClose={onClose} title={employee ? employee.name : 'Сотрудник'} size="lg">
        {!data && !error && <div className="grid place-items-center py-14"><Spinner /></div>}
        {error && <p className="text-sm text-danger">{error}</p>}

        {data && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={employee.name} email={employee.email} src={employee.avatarUrl} color={employee.avatarColor} size={40} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{employee.name}</span>
                <span className="truncate text-xs text-ink-3">
                  {data.profile?.title || 'Профиль не назначен'}
                  {employee.department ? ` · ${employee.department.name}` : ''}
                </span>
              </div>
              {/* Отключённому сотруднику пополнять и ставить баллы нельзя —
                  сервер всё равно откажет, так что и кнопок нет. */}
              {canManage && data.isCurrent && employee.active && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onTopUp(employee.id)}>Пополнить банк</Button>
                  <Button size="sm" variant="secondary" onClick={() => onAddPoints(employee.id)}>Добавить баллы</Button>
                  {data.permissions.canWriteOff && data.bank.cents > 0 && (
                    <Button size="sm" variant="danger" onClick={() => setWriteOffOpen(true)}>Списать</Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {[['motivation', 'Мотивация'], ['conditions', 'Условия']].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={cx(
                      'px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
                      tab === id ? 'bg-accent text-white' : 'panel text-ink-3 hover:text-ink',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {tab === 'motivation' && (
                <MonthSelect months={data.months} current={data.currentMonth} value={data.month} onChange={setViewMonth} className="w-56" />
              )}
            </div>

            {tab === 'motivation' ? (
              <MotivationView data={data} onCancelEvent={data.permissions.canCancel ? setCancelling : undefined} />
            ) : conditions ? (
              <ConditionsView data={conditions} />
            ) : (
              <div className="grid place-items-center py-10"><Spinner /></div>
            )}
          </div>
        )}
      </Modal>

      <CancelEventModal
        event={cancelling}
        onClose={() => setCancelling(null)}
        onSubmit={async (id, reason) => {
          const res = await cancelEvent(id, reason)
          if (res.ok) await afterChange()
          return res
        }}
      />

      <WriteOffModal
        open={writeOffOpen}
        onClose={() => setWriteOffOpen(false)}
        employee={employee}
        bankCents={data?.bank.cents || 0}
        onSubmit={async (body) => {
          const res = await writeOff(body)
          if (res.ok) await afterChange()
          return res
        }}
      />
    </>
  )
}
