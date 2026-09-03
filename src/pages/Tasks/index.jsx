import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../core/store/authStore'
import { useTasksStore } from '../../core/store/tasksStore'
import { useDepartmentsStore } from '../../core/store/departmentsStore'
import { PageSection } from '../../widgets'
import { Card, Button, EmptyState, ConfirmModal } from '../../shared/ui'
import { DeptTabs } from '../../components/tasks/DeptTabs'
import { Column } from '../../components/tasks/Column'
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal'
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal'
import { EditTaskModal } from '../../components/hierarchy/EditTaskModal'
import { ExtendDeadlineModal } from '../../components/hierarchy/ExtendDeadlineModal'
import { COLUMNS, REFRESH_MS, scopeHint } from '../../utils/tasks'

const MINE = '__mine__'

export default function TasksPage() {
  const currentUser = useAuthStore((s) => s.user)
  const tasks = useTasksStore((s) => s.tasks)
  const loading = useTasksStore((s) => s.loading)
  const fetchTasks = useTasksStore((s) => s.fetchTasks)
  const createTask = useTasksStore((s) => s.createTask)
  const moveTask = useTasksStore((s) => s.moveTask)
  const editTask = useTasksStore((s) => s.editTask)
  const extendDeadline = useTasksStore((s) => s.extendDeadline)
  const removeTask = useTasksStore((s) => s.removeTask)

  const departments = useDepartmentsStore((s) => s.departments)
  const departmentsLoading = useDepartmentsStore((s) => s.loading)
  const fetchDepartments = useDepartmentsStore((s) => s.fetchDepartments)

  const isAdmin = currentUser?.role === 'admin'

  const [createOpen, setCreateOpen] = useState(false)
  const [openTask, setOpenTask] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [extendingTask, setExtendingTask] = useState(null)
  const [deletingTask, setDeletingTask] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [activeDept, setActiveDept] = useState(null)

  useEffect(() => {
    fetchTasks({ standalone: true })
    if (isAdmin) fetchDepartments()
    const timer = setInterval(() => fetchTasks({ standalone: true }), REFRESH_MS)
    return () => clearInterval(timer)
  }, [fetchTasks, fetchDepartments, isAdmin])

  useEffect(() => {
    if (isAdmin && !activeDept) setActiveDept(MINE)
  }, [isAdmin, activeDept])

  const visibleTasks = useMemo(() => {
    // Задачник и Иерархия читают один и тот же tasks в сторе — если
    // админ до этого заходил в Иерархию, там fetchTasks() (без
    // standalone) успел перезаписать общий список ВСЕМИ задачами,
    // включая привязанные к работам. Пока не отработает свежий
    // fetchTasks({standalone:true}) с этой страницы, на экране на
    // мгновение мелькают чужие данные из Иерархии — а при медленной
    // сети не на мгновение. Поэтому здесь ещё раз фильтруем на глазах,
    // а не доверяем слепо тому, что сейчас лежит в общем сторе.
    // origin, а не workId — workId специально обнуляется на бэке при
    // удалении работы/клиента (чтобы не терять историю задач), и тогда
    // задача из Иерархии выглядит как личная. origin ставится один раз
    // при создании и не меняется, на него можно полагаться всегда.
    const standaloneOnly = tasks.filter((t) => t.origin === 'personal')
    if (!isAdmin) return standaloneOnly
    if (!activeDept) return []
    if (activeDept === MINE) return standaloneOnly.filter((t) => t.ownerId === currentUser?.id)
    return standaloneOnly.filter((t) => t.departmentId === activeDept)
  }, [tasks, isAdmin, activeDept, currentUser])

  const tabs = useMemo(
    () => (isAdmin ? [{ id: MINE, name: 'Мои задачи' }, ...departments] : []),
    [isAdmin, departments],
  )

  const byColumn = useMemo(() => {
    const map = { today: [], progress: [], done: [] }
    for (const t of visibleTasks) map[t.status]?.push(t)
    return map
  }, [visibleTasks])

  // «Мои задачи» доступна всегда, даже если отделов ещё нет — а вот
  // пустое состояние про «создайте отдел» показываем только когда
  // реально выбрана вкладка отдела, а не своя.
  const noDepartments = isAdmin && activeDept !== MINE && !departmentsLoading && departments.length === 0

  // Личный дневник: у админа в его собственном "Мои задачи" — без
  // авто-удаления по ночам, с полным редактированием и удалением, и
  // стрелки переноса не блокируются просрочкой. У остальных сотрудников
  // ничего из этого нет — доска работает как и раньше.
  const isAdminDiary = (task) => isAdmin && task.ownerId === currentUser?.id

  async function confirmDelete() {
    if (!deletingTask) return
    setDeleteBusy(true)
    const res = await removeTask(deletingTask.id)
    setDeleteBusy(false)
    setDeletingTask(null)
    if (!res.ok) window.alert(res.error || 'Не удалось удалить задачу')
  }

  return (
    <PageSection
      pill="Задачи"
      title="Задачи"
      subtitle={scopeHint(currentUser)}
      actions={<Button onClick={() => setCreateOpen(true)}>+ Задача на день</Button>}
    >
      {isAdmin && (
        <DeptTabs departments={tabs} active={activeDept} onSelect={setActiveDept} />
      )}

      {noDepartments ? (
        <Card pad="md">
          <EmptyState label="Отделов нет" text="Создайте отдел, чтобы видеть его задачи по вкладкам." />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              col={col}
              tasks={byColumn[col.key]}
              loading={loading && tasks.length === 0}
              currentUser={currentUser}
              onMove={moveTask}
              onOpen={setOpenTask}
            />
          ))}
        </div>
      )}

      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (payload) => {
          const res = await createTask(payload)
          if (res.ok && isAdmin) setActiveDept(MINE)
          return res
        }}
      />

      <TaskDetailModal
        task={openTask}
        onClose={() => setOpenTask(null)}
        isMine={openTask?.ownerId === currentUser?.id}
        isAdminDiary={openTask ? isAdminDiary(openTask) : false}
        onMove={moveTask}
        onEdit={setEditingTask}
        onExtend={setExtendingTask}
        onDelete={setDeletingTask}
      />

      <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} onSubmit={editTask} />

      <ExtendDeadlineModal task={extendingTask} onClose={() => setExtendingTask(null)} onSubmit={extendDeadline} />

      <ConfirmModal
        open={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={confirmDelete}
        loading={deleteBusy}
        danger
        title="Удалить задачу?"
        confirmText="Удалить"
        text={deletingTask ? `«${deletingTask.title}» пропадёт без возможности отменить.` : ''}
      />
    </PageSection>
  )
}