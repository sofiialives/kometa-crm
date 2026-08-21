import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../core/store/authStore'
import { useUsersStore } from '../../core/store/usersStore'
import { useDepartmentsStore } from '../../core/store/departmentsStore'
import { useWorksStore } from '../../core/store/worksStore'
import { useTasksStore } from '../../core/store/tasksStore'
import { PageSection } from '../../widgets'
import { Button, Card, EmptyState, Spinner, ConfirmModal } from '../../shared/ui'
import { DeptTabs } from '../../components/tasks/DeptTabs'
import { DepartmentPanel } from '../../components/hierarchy/DepartmentPanel'
import { WorkCard } from '../../components/hierarchy/WorkCard'
import { CreateWorkModal } from '../../components/hierarchy/CreateWorkModal'
import { AddTaskModal } from '../../components/hierarchy/AddTaskModal'
import { AssigneesModal } from '../../components/hierarchy/AssigneesModal'
import { ExtendDeadlineModal } from '../../components/hierarchy/ExtendDeadlineModal'
import { EditTaskModal } from '../../components/hierarchy/EditTaskModal'
import { InviteUserModal } from '../../components/admin/InviteUserModal'
import { inviteMember } from '../../core/store/team'
import { ALL_DEPARTMENTS, sortWorks, tasksOfWork, visibleDepartments } from '../../utils/hierarchy'

export default function HierarchyPage() {
  const currentUser = useAuthStore((s) => s.user)

  const users = useUsersStore((s) => s.users)
  const fetchUsers = useUsersStore((s) => s.fetchUsers)

  const departments = useDepartmentsStore((s) => s.departments)
  const departmentsLoading = useDepartmentsStore((s) => s.loading)
  const departmentsError = useDepartmentsStore((s) => s.error)
  const fetchDepartments = useDepartmentsStore((s) => s.fetchDepartments)

  const works = useWorksStore((s) => s.works)
  const worksLoading = useWorksStore((s) => s.loading)
  const worksError = useWorksStore((s) => s.error)
  const fetchWorks = useWorksStore((s) => s.fetchWorks)
  const createWork = useWorksStore((s) => s.createWork)
  const updateWork = useWorksStore((s) => s.updateWork)
  const deleteWork = useWorksStore((s) => s.deleteWork)

  const tasks = useTasksStore((s) => s.tasks)
  const tasksError = useTasksStore((s) => s.error)
  const fetchTasks = useTasksStore((s) => s.fetchTasks)
  const createTask = useTasksStore((s) => s.createTask)
  const moveTask = useTasksStore((s) => s.moveTask)
  const extendDeadline = useTasksStore((s) => s.extendDeadline)
  const editTask = useTasksStore((s) => s.editTask)
  const removeTask = useTasksStore((s) => s.removeTask)

  const isAdmin = currentUser?.role === 'admin'
  const canManage = isAdmin || currentUser?.role === 'lead'

  const [activeDept, setActiveDept] = useState(ALL_DEPARTMENTS)
  const [workOpen, setWorkOpen] = useState(false)
  const [invitingTo, setInvitingTo] = useState(null)
  const [addingTaskTo, setAddingTaskTo] = useState(null)
  const [editingAssignees, setEditingAssignees] = useState(null)
  const [extendingTask, setExtendingTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [deletingTask, setDeletingTask] = useState(null)
  const [deletingWork, setDeletingWork] = useState(null)
  const [busyTaskId, setBusyTaskId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    fetchDepartments()
    fetchWorks()
    fetchTasks()
    // GET /users открыт только админу и главному, рядовому он вернёт 403.
    if (canManage) fetchUsers()
  }, [fetchDepartments, fetchWorks, fetchTasks, fetchUsers, canManage])

  const myDepartments = useMemo(
    () => visibleDepartments(departments, currentUser),
    [departments, currentUser],
  )

  // Не-админ видит ровно один отдел, поэтому вкладок у него нет и выбранным
  // всегда остаётся его собственный.
  useEffect(() => {
    if (!isAdmin && myDepartments.length > 0) setActiveDept(myDepartments[0].id)
  }, [isAdmin, myDepartments])

  const shownDepartments = useMemo(
    () => (activeDept === ALL_DEPARTMENTS ? myDepartments : myDepartments.filter((d) => d.id === activeDept)),
    [myDepartments, activeDept],
  )

  const shownWorks = useMemo(
    () => sortWorks(activeDept === ALL_DEPARTMENTS ? works : works.filter((w) => w.departmentId === activeDept)),
    [works, activeDept],
  )

  const clients = useMemo(
    () => [...new Set(works.map((w) => w.clientName).filter(Boolean))].sort(),
    [works],
  )

  const tabs = useMemo(
    () => [{ id: ALL_DEPARTMENTS, name: 'Все' }, ...myDepartments],
    [myDepartments],
  )

  const activeWorksOf = (departmentId) =>
    works.filter((w) => w.departmentId === departmentId && w.status === 'active').length

  const departmentName = (id) => departments.find((d) => d.id === id)?.name

  // Ошибку показываем одну: свежую от действия, иначе первую сорванную загрузку.
  const error = actionError || departmentsError || worksError || tasksError

  async function toggleTask(task) {
    setBusyTaskId(task.id)
    setActionError(null)
    const res = await moveTask(task.id, task.status === 'done' ? 'progress' : 'done')
    setBusyTaskId(null)
    if (!res.ok) setActionError(res.error)
  }

  async function confirmDeleteTask() {
    if (!deletingTask) return
    setBusy(true)
    const res = await removeTask(deletingTask.id)
    setBusy(false)
    setDeletingTask(null)
    if (!res.ok) setActionError(res.error)
  }

  async function confirmDeleteWork() {
    if (!deletingWork) return
    setBusy(true)
    const res = await deleteWork(deletingWork.id)
    setBusy(false)
    setDeletingWork(null)
    if (!res.ok) setActionError(res.error)
  }

  const loading = (departmentsLoading || worksLoading) && departments.length === 0

  return (
    <PageSection
      pill="Иерархия"
      title="Иерархия отделов"
      subtitle={isAdmin ? 'Все отделы и работы в них.' : 'Ваш отдел и его работы.'}
      actions={canManage && <Button onClick={() => setWorkOpen(true)}>+ Работа</Button>}
    >
      {error && (
        <div className="rounded-xl border border-danger/35 bg-danger/10 px-4 py-3 text-[13px] text-danger">
          {error}
        </div>
      )}

      {isAdmin && myDepartments.length > 0 && (
        <DeptTabs departments={tabs} active={activeDept} onSelect={setActiveDept} />
      )}

      {loading ? (
        <Card pad="lg" className="grid place-items-center">
          <Spinner size={22} />
        </Card>
      ) : myDepartments.length === 0 ? (
        <Card pad="md">
          <EmptyState
            label="Отделов нет"
            text={isAdmin ? 'Создайте отдел в админ-панели.' : 'Вас ещё не добавили в отдел.'}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-start">
          <div className="flex flex-col gap-4">
            {shownDepartments.map((d) => (
              <DepartmentPanel
                key={d.id}
                department={d}
                users={users}
                worksCount={activeWorksOf(d.id)}
                canSeeMembers={canManage}
                canInvite={isAdmin}
                onInvite={() => setInvitingTo(d.id)}
              />
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {shownWorks.length === 0 ? (
              <Card pad="md">
                <EmptyState
                  label="Работ нет"
                  text={canManage ? 'Создайте первую работу для клиента.' : 'В вашем отделе пока нет работ.'}
                  action={canManage && <Button onClick={() => setWorkOpen(true)}>+ Работа</Button>}
                />
              </Card>
            ) : (
              shownWorks.map((w) => (
                <WorkCard
                  key={w.id}
                  work={w}
                  // На вкладке «Все» отделов несколько, и без подписи работа
                  // читается как принадлежащая соседней карточке отдела.
                  departmentName={isAdmin && activeDept === ALL_DEPARTMENTS ? departmentName(w.departmentId) : undefined}
                  tasks={tasksOfWork(tasks, w.id)}
                  currentUser={currentUser}
                  busyTaskId={busyTaskId}
                  canManage={canManage}
                  onToggleTask={toggleTask}
                  onAddTask={setAddingTaskTo}
                  onEditAssignees={() => setEditingAssignees(w)}
                  onEditTask={setEditingTask}
                  onExtendTask={setExtendingTask}
                  onDeleteTask={setDeletingTask}
                  onDeleteWork={setDeletingWork}
                />
              ))
            )}
          </div>
        </div>
      )}

      <CreateWorkModal
        open={workOpen}
        onClose={() => setWorkOpen(false)}
        departments={myDepartments}
        clients={clients}
        defaultDepartmentId={activeDept === ALL_DEPARTMENTS ? undefined : activeDept}
        onSubmit={async (payload) => {
          const res = await createWork(payload)
          if (res.ok) await fetchWorks()
          return res
        }}
      />

      <AddTaskModal
        work={addingTaskTo}
        currentUser={currentUser}
        users={users}
        onClose={() => setAddingTaskTo(null)}
        onSubmit={async (payload) => {
          const res = await createTask(payload)
          if (res.ok) await fetchTasks()
          return res
        }}
      />

      <AssigneesModal
        work={editingAssignees}
        users={users}
        onClose={() => setEditingAssignees(null)}
        onSubmit={async (work, assignees) => {
          const res = await updateWork(work.id, { assignees })
          if (res.ok) await fetchWorks()
          return res
        }}
      />

      <ExtendDeadlineModal
        task={extendingTask}
        onClose={() => setExtendingTask(null)}
        onSubmit={extendDeadline}
      />

      <EditTaskModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={editTask}
      />

      <ConfirmModal
        open={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={confirmDeleteTask}
        loading={busy}
        danger
        title="Удалить задачу?"
        confirmText="Удалить"
        text={deletingTask ? `«${deletingTask.title}» пропадёт без возможности отменить.` : ''}
      />

      <ConfirmModal
        open={Boolean(deletingWork)}
        onClose={() => setDeletingWork(null)}
        onConfirm={confirmDeleteWork}
        loading={busy}
        danger
        title="Удалить работу?"
        confirmText="Удалить"
        text={
          deletingWork
            ? `«${deletingWork.title}» для клиента «${deletingWork.clientName}» пропадёт. Задачи останутся у сотрудников, но отвяжутся от этой работы.`
            : ''
        }
      />

      <InviteUserModal
        open={Boolean(invitingTo)}
        onClose={() => setInvitingTo(null)}
        departments={departments}
        defaultDepartmentId={invitingTo}
        onSubmit={async (payload) => {
          const res = await inviteMember(payload)
          if (res.ok) {
            await fetchUsers()
            await fetchDepartments()
          }
          return res
        }}
      />
    </PageSection>
  )
}
