import { useCallback, useEffect, useState } from 'react'
import { Button, Select, Spinner } from '../../shared/ui'
import { useMotivationStore } from '../../core/store/motivationStore'
import { useAutoRefresh } from '../../shared/lib/useAutoRefresh'
import { useClientsStore } from '../../core/store/clientsStore'
import { useAuthStore } from '../../core/store/authStore'
import { TeamTable } from './TeamTable'
import { MonthSelect } from './MonthSelect'
import { TopUpModal } from './TopUpModal'
import { ManualPointsModal } from './ManualPointsModal'
import { ProductModal } from './ProductModal'
import { ExportBar } from './ExportBar'
import { EmployeeModal } from './EmployeeModal'
import { employeesWord } from '../../utils/motivation'

/**
 * Раздел «Команда». Руководитель видит сотрудников своего отдела и только
 * смотрит. Владелец видит всех, у кого есть банк, и начисляет: три кнопки
 * из задания — «Пополнить банк», «Добавить баллы вручную» и «Клиент купил
 * новый продукт». Клик по человеку открывает его экраны.
 */
export function TeamSection({ month, onMonthChange }) {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const {
    team, teamMonths, teamLoading, teamError, employees,
    fetchTeam, fetchTeamMonths, fetchEmployees, fetchManualOptions,
    topUp, addManual, addProduct,
  } = useMotivationStore()
  const clients = useClientsStore((s) => s.clients)
  const fetchClients = useClientsStore((s) => s.fetchClients)

  const [departmentId, setDepartmentId] = useState('')
  const [openId, setOpenId] = useState(null)
  const [modal, setModal] = useState(null)
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => fetchTeam({ month, departmentId }), [fetchTeam, month, departmentId])

  useEffect(() => {
    fetchTeamMonths()
    // Формы начисления есть только у владельца — руководителю списки для
    // них не нужны, сервер их ему и не отдаст.
    if (isAdmin) { fetchEmployees(); fetchClients() }
  }, [fetchTeamMonths, fetchEmployees, fetchClients, isAdmin])
  useEffect(() => { reload() }, [reload])
  useAutoRefresh(reload)

  // Действие в любой форме — перезапрос таблицы и открытой карточки.
  const wrap = (fn) => async (body) => {
    const res = await fn(body)
    if (res.ok) {
      await reload()
      setVersion((v) => v + 1)
    }
    return res
  }

  const isCurrent = team?.isCurrent ?? true
  const months = teamMonths.length ? teamMonths : (team ? [team.month] : [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <MonthSelect months={months} current={team?.currentMonth} value={month || team?.month} onChange={onMonthChange} className="w-60" />
          {isAdmin && team && (
            <Select
              size="sm"
              className="w-56"
              placeholder="Все отделы"
              options={team.departments.map((d) => ({ value: d.id, label: d.name }))}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              aria-label="Отдел"
            />
          )}
        </div>

        {isAdmin && isCurrent && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setModal({ kind: 'topUp', preselected: [] })}>Пополнить банк</Button>
            <Button size="sm" variant="secondary" onClick={() => setModal({ kind: 'manual' })}>Добавить баллы вручную</Button>
            <Button size="sm" variant="secondary" onClick={() => setModal({ kind: 'product', preselected: [] })}>Клиент купил новый продукт</Button>
          </div>
        )}
      </div>

      {isAdmin && team && <ExportBar month={team.month} closedAt={team.closedAt} isCurrent={team.isCurrent} />}
      {!isAdmin && team?.closedAt && (
        <p className="text-xs text-ok">Месяц закрыт: итоги зафиксированы</p>
      )}

      {team && team.withoutProfile > 0 && (
        <p className="text-sm text-warn">
          {employeesWord(team.withoutProfile)} без профиля должности: условия получения баллов для них не заданы.
          {isAdmin ? ' Назначить профиль можно в «Настройках».' : ' Профиль назначает владелец.'}
        </p>
      )}

      {/* Ошибка видна и поверх таблицы прошлого запроса. */}
      {teamError && <p className="text-sm text-danger">{teamError}</p>}

      {teamLoading && !team ? (
        <div className="grid place-items-center py-14"><Spinner /></div>
      ) : team ? (
        <TeamTable rows={team.rows} totals={team.totals} isCurrent={team.isCurrent} onOpen={(r) => setOpenId(r.employee.id)} />
      ) : null}

      <EmployeeModal
        key={openId || 'closed'}
        employeeId={openId}
        month={team?.month}
        refreshKey={version}
        onClose={() => setOpenId(null)}
        onTopUp={(id) => setModal({ kind: 'topUp', preselected: [id] })}
        onAddPoints={(id) => setModal({ kind: 'manual', preselected: id })}
        onChanged={reload}
      />

      <TopUpModal
        open={modal?.kind === 'topUp'}
        onClose={() => setModal(null)}
        employees={employees}
        clients={clients}
        preselected={modal?.preselected}
        onSubmit={wrap(topUp)}
      />

      <ManualPointsModal
        open={modal?.kind === 'manual'}
        onClose={() => setModal(null)}
        employees={employees}
        preselected={modal?.preselected}
        loadOptions={fetchManualOptions}
        onSubmit={wrap(addManual)}
      />

      <ProductModal
        open={modal?.kind === 'product'}
        onClose={() => setModal(null)}
        employees={employees}
        clients={clients}
        preselected={modal?.preselected}
        onSubmit={wrap(addProduct)}
      />
    </div>
  )
}
