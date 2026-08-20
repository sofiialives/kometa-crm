import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../core/store/authStore'
import { useTasksStore } from '../../core/store/tasksStore'
import { useDepartmentsStore } from '../../core/store/departmentsStore'
import { PageSection } from '../../widgets'
import { Card, Button, EmptyState } from '../../shared/ui'
import { DeptTabs } from '../../components/tasks/DeptTabs'
import { Column } from '../../components/tasks/Column'
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal'
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal'
import { COLUMNS, REFRESH_MS, scopeHint } from '../../utils/tasks'

export default function TasksPage() {
  const currentUser = useAuthStore((s) => s.user)
  const tasks = useTasksStore((s) => s.tasks)
  const loading = useTasksStore((s) => s.loading)
  const fetchTasks = useTasksStore((s) => s.fetchTasks)
  const createTask = useTasksStore((s) => s.createTask)
  const moveTask = useTasksStore((s) => s.moveTask)

  const departments = useDepartmentsStore((s) => s.departments)
  const departmentsLoading = useDepartmentsStore((s) => s.loading)
  const fetchDepartments = useDepartmentsStore((s) => s.fetchDepartments)

  const isAdmin = currentUser?.role === 'admin'

  const [createOpen, setCreateOpen] = useState(false)
  const [openTask, setOpenTask] = useState(null)
  const [activeDept, setActiveDept] = useState(null)

  useEffect(() => {
    fetchTasks()
    if (isAdmin) fetchDepartments()
    const timer = setInterval(fetchTasks, REFRESH_MS)
    return () => clearInterval(timer)
  }, [fetchTasks, fetchDepartments, isAdmin])

  useEffect(() => {
    if (isAdmin && !activeDept && departments.length > 0) {
      setActiveDept(departments[0].id)
    }
  }, [isAdmin, departments, activeDept])

  const visibleTasks = useMemo(() => {
    if (!isAdmin) return tasks
    if (!activeDept) return []
    return tasks.filter((t) => t.departmentId === activeDept)
  }, [tasks, isAdmin, activeDept])

  const byColumn = useMemo(() => {
    const map = { today: [], progress: [], done: [] }
    for (const t of visibleTasks) map[t.status]?.push(t)
    return map
  }, [visibleTasks])

  const noDepartments = isAdmin && !departmentsLoading && departments.length === 0

  return (
    <PageSection
      pill="Задачи"
      title="Задачи"
      subtitle={scopeHint(currentUser)}
      actions={<Button onClick={() => setCreateOpen(true)}>+ Задача на день</Button>}
    >
      {isAdmin && departments.length > 0 && (
        <DeptTabs departments={departments} active={activeDept} onSelect={setActiveDept} />
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

      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={createTask} />

      <TaskDetailModal
        task={openTask}
        onClose={() => setOpenTask(null)}
        isMine={openTask?.ownerId === currentUser?.id}
        onMove={moveTask}
      />
    </PageSection>
  )
}
