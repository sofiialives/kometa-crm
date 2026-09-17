import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuthStore } from '../../core/store/authStore'
import { useUsersStore } from '../../core/store/usersStore'
import { useDepartmentsStore } from '../../core/store/departmentsStore'
import { useTasksStore } from '../../core/store/tasksStore'
import { useWorksStore } from '../../core/store/worksStore'
import { useClientsStore } from '../../core/store/clientsStore'
import { PageSection } from '../../widgets'
import { Button, Card, EmptyState, Spinner, ConfirmModal } from '../../shared/ui'
import { DepartmentCard } from '../../components/admin/DepartmentCard'
import { AllUsersTable } from '../../components/admin/AllUsersTable'
import { ClientsList } from '../../components/admin/ClientsList'
import { CreateClientModal } from '../../components/admin/CreateClientModal'
import { CreateDepartmentModal } from '../../components/admin/CreateDepartmentModal'
import { InviteUserModal } from '../../components/admin/InviteUserModal'
import { MoveUserModal } from '../../components/admin/MoveUserModal'
import { inviteMember, setLead } from '../../core/store/team'
import { displayName } from '../../utils/admin'

export default function AdminPage() {
  const currentUser = useAuthStore((s) => s.user)

  const users = useUsersStore((s) => s.users)
  const usersLoading = useUsersStore((s) => s.loading)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)
  const updateUser = useUsersStore((s) => s.updateUser)
  const deactivateUser = useUsersStore((s) => s.deactivateUser)
  const taskStats = useUsersStore((s) => s.taskStats)
  const fetchTaskStats = useUsersStore((s) => s.fetchTaskStats)

  const departments = useDepartmentsStore((s) => s.departments)
  const departmentsLoading = useDepartmentsStore((s) => s.loading)
  const fetchDepartments = useDepartmentsStore((s) => s.fetchDepartments)
  const createDepartment = useDepartmentsStore((s) => s.createDepartment)
  const updateDepartment = useDepartmentsStore((s) => s.updateDepartment)
  const deleteDepartment = useDepartmentsStore((s) => s.deleteDepartment)

  const tasks = useTasksStore((s) => s.tasks)
  const fetchTasks = useTasksStore((s) => s.fetchTasks)

  const works = useWorksStore((s) => s.works)
  const fetchWorks = useWorksStore((s) => s.fetchWorks)

  const clients = useClientsStore((s) => s.clients)
  const fetchClients = useClientsStore((s) => s.fetchClients)
  const createClient = useClientsStore((s) => s.createClient)
  const updateClient = useClientsStore((s) => s.updateClient)
  const deleteClient = useClientsStore((s) => s.deleteClient)

  const [deptOpen, setDeptOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [moving, setMoving] = useState(null)
  const [dismissing, setDismissing] = useState(null)
  const [deletingDept, setDeletingDept] = useState(null)
  const [deletingClient, setDeletingClient] = useState(null)
  const [addingClient, setAddingClient] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  // Два быстрых клика подряд прочитали бы устаревший leadId из замыкания.
  // Лочим по ссылке: setState асинхронный и от гонки не спасает.
  const lock = useRef(false)

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
    // Админ видит все задачи (без scope) — этого достаточно, чтобы
    // посчитать готово/просрочено на каждого сотрудника без отдельного
    // эндпоинта под статистику. Но это только СЕГОДНЯШНИЕ, ещё не
    // удалённые ночной чисткой — накопленное за прошлые дни отдельно
    // подтягиваем из копилки (fetchTaskStats).
    fetchTasks()
    fetchTaskStats()
    // Работы нужны, чтобы сказать про них до удаления отдела, а не после:
    // бэк такой отдел не отдаст, и человек узнавал об этом уже нажав «Удалить».
    fetchWorks()
    fetchClients()
  }, [fetchUsers, fetchDepartments, fetchTasks, fetchTaskStats, fetchWorks, fetchClients])

  async function refresh() {
    await Promise.all([fetchUsers(), fetchDepartments()])
  }

  const statsByUser = useMemo(() => {
    const map = {}
    for (const [userId, s] of Object.entries(taskStats)) {
      map[userId] = { done: s.doneCount, overdue: s.overdueCount }
    }
    for (const t of tasks) {
      if (!t.ownerId) continue
      if (!map[t.ownerId]) map[t.ownerId] = { done: 0, overdue: 0 }
      if (t.status === 'done') map[t.ownerId].done += 1
      else if (t.overdue) map[t.ownerId].overdue += 1
    }
    return map
  }, [tasks, taskStats])

  const leadDepartmentOf = (user) => departments.find((d) => d.leadId === user.id) || null

  async function promote(user) {
    const department = departments.find((d) => d.id === user.departmentId)
    if (!department || lock.current) return
    lock.current = true
    setBusy(true)
    setError(null)

    let res = await updateUser(user.id, { role: 'lead' })
    if (res.ok) res = await setLead(department.id, user.id)

    await refresh()
    lock.current = false
    setBusy(false)
    if (!res.ok) setError(res.error)
  }

  // Той же модалкой правят должность внутри своего отдела, поэтому снимаем
  // руководство только при реальном переходе — иначе главный терял бы отдел,
  // просто поменяв себе должность.
  async function move(user, { departmentId, position }) {
    const leaving = departmentId !== user.departmentId
    const leadOf = leaving ? leadDepartmentOf(user) : null
    if (leadOf) {
      const res = await updateDepartment(leadOf.id, { leadId: null })
      if (!res.ok) return res
    }

    const res = await updateUser(user.id, {
      departmentId,
      // Должность главного служебная — модалка её не отдаёт, и перезаписывать
      // «Начальник отдела» первой должностью из списка нельзя.
      ...(position ? { position } : {}),
      ...(leadOf ? { role: 'staff' } : {}),
    })
    await refresh()
    return res
  }

  // Бэк снимает отдел, роль и доступ, но leadId в отделе не чистит — иначе
  // отдел остался бы ссылаться на уволенного. Чистим сами и строго до
  // увольнения: не прошло — увольнять нельзя.
  async function dismiss(user) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError(null)

    const leadOf = leadDepartmentOf(user)
    if (leadOf) {
      const cleared = await updateDepartment(leadOf.id, { leadId: null })
      if (!cleared.ok) {
        lock.current = false
        setBusy(false)
        return setError(cleared.error)
      }
    }

    const res = await deactivateUser(user.id)
    await refresh()
    lock.current = false
    setBusy(false)
    setDismissing(null)
    if (!res.ok) setError(res.error)
  }

  const loading = (usersLoading || departmentsLoading) && users.length === 0 && departments.length === 0

  const worksByDepartment = useMemo(() => {
    const map = {}
    for (const w of works) map[w.departmentId] = (map[w.departmentId] || 0) + 1
    return map
  }, [works])

  // Сколько у клиента работ и задач — считается на лету из уже
  // загруженных works/tasks, отдельный эндпоинт под статистику не нужен.
  const statsByClient = useMemo(() => {
    const map = {}
    for (const w of works) {
      if (!w.client) continue
      if (!map[w.client.id]) map[w.client.id] = { worksCount: 0, tasksCount: 0 }
      map[w.client.id].worksCount += 1
    }
    for (const t of tasks) {
      if (!t.workId) continue
      const work = works.find((w) => w.id === t.workId)
      if (work?.client && map[work.client.id]) map[work.client.id].tasksCount += 1
    }
    return map
  }, [works, tasks])

  async function confirmDeleteDepartment() {
    if (!deletingDept) return
    setBusy(true)
    const res = await deleteDepartment(deletingDept.id)
    setBusy(false)
    setDeletingDept(null)
    if (!res.ok) setError(res.error)
  }

  async function confirmDeleteClient() {
    if (!deletingClient) return
    setBusy(true)
    const res = await deleteClient(deletingClient.id)
    setBusy(false)
    setDeletingClient(null)
    if (!res.ok) setError(res.error)
  }

  return (
    <PageSection
      pill="Админ-панель"
      title="Управление командой"
      actions={
        <>
          <Button variant="secondary" onClick={() => setDeptOpen(true)}>+ Отдел</Button>
          <Button onClick={() => setInviteOpen(true)}>+ Сотрудник</Button>
        </>
      }
    >
      {error && (
        <div className="rounded-xl border border-danger/35 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <Card pad="lg" className="grid place-items-center">
          <Spinner size={22} />
        </Card>
      ) : departments.length === 0 ? (
        <Card pad="md">
          <EmptyState
            label="Отделов нет"
            text="Создайте первый отдел и заведите в нём должности — без этого нельзя пригласить сотрудника."
            action={<Button onClick={() => setDeptOpen(true)}>+ Отдел</Button>}
          />
        </Card>
      ) : (
        // z-10: меню сотрудника вылезает за карточку и рисуется поверх таблицы
        <div className="relative z-10 grid gap-4 lg:grid-cols-2">
          {departments.map((d) => (
            <DepartmentCard
              key={d.id}
              department={d}
              users={users}
              onPromote={promote}
              onMove={setMoving}
              onDismiss={setDismissing}
              onDelete={setDeletingDept}
              worksCount={worksByDepartment[d.id] || 0}
              statsByUser={statsByUser}
              onAddPosition={async (department, position) => {
                const res = await updateDepartment(department.id, {
                  positions: [...department.positions, position],
                })
                if (!res.ok) setError(res.error)
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-0">
        <AllUsersTable
          users={users}
          departments={departments}
          currentUserId={currentUser?.id}
          onDismiss={setDismissing}
          statsByUser={statsByUser}
        />
      </div>

      <ClientsList
        clients={clients}
        statsByClient={statsByClient}
        onAdd={() => setAddingClient(true)}
        onEdit={setEditingClient}
        onDelete={setDeletingClient}
      />

      <CreateDepartmentModal
        open={deptOpen}
        onClose={() => setDeptOpen(false)}
        onSubmit={async (payload) => {
          const res = await createDepartment(payload)
          if (res.ok) await refresh()
          return res
        }}
      />

      <InviteUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        departments={departments}
        onSubmit={async (payload) => {
          const res = await inviteMember(payload)
          if (res.ok) await refresh()
          return res
        }}
      />

      <MoveUserModal
        user={moving}
        departments={departments}
        onClose={() => setMoving(null)}
        onSubmit={move}
      />

      <ConfirmModal
        open={Boolean(dismissing)}
        onClose={() => setDismissing(null)}
        onConfirm={() => dismiss(dismissing)}
        loading={busy}
        danger
        title="Уволить сотрудника?"
        confirmText="Уволить"
        text={
          dismissing
            ? displayName(dismissing) +
              ' потеряет доступ к системе. Запись и его задачи останутся, отдел и должность снимутся.'
            : ''
        }
      />

      <ConfirmModal
        open={Boolean(deletingDept)}
        onClose={() => setDeletingDept(null)}
        onConfirm={confirmDeleteDepartment}
        loading={busy}
        danger
        title="Удалить отдел?"
        confirmText="Удалить"
        text={deletingDept ? `Отдел «${deletingDept.name}» пропадёт без возможности отменить.` : ''}
      />

      <ConfirmModal
        open={Boolean(deletingClient)}
        onClose={() => setDeletingClient(null)}
        onConfirm={confirmDeleteClient}
        loading={busy}
        danger
        title="Удалить клиента?"
        confirmText="Удалить"
        text={
          deletingClient
            ? `Клиент «${deletingClient.name}» и все его работы (${statsByClient[deletingClient.id]?.worksCount || 0}) пропадут без возможности отменить. Задачи сотрудников останутся, но отвяжутся от этих работ.`
            : ''
        }
      />

      <CreateClientModal
        open={addingClient}
        onClose={() => setAddingClient(false)}
        onSubmit={createClient}
      />

      <CreateClientModal
        open={Boolean(editingClient)}
        client={editingClient}
        onClose={() => setEditingClient(null)}
        onSubmit={updateClient}
      />
    </PageSection>
  )
}