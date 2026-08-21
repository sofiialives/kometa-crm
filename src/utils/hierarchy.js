import { withPlural } from '../shared/lib/plural'

const WORK_STATUS = {
  active: { label: 'В работе', tone: 'brand' },
  done: { label: 'Готово', tone: 'ok' },
  archived: { label: 'В архиве', tone: 'neutral' },
}

export function workBadge(status) {
  return WORK_STATUS[status] || WORK_STATUS.active
}

export function isOverdue(task) {
  return task.status !== 'done' && new Date(task.deadline).getTime() < Date.now()
}

export function taskBadge(task) {
  if (task.status === 'done') return { label: 'Готово', tone: 'ok' }
  if (isOverdue(task)) return { label: 'Срок прошёл', tone: 'warn' }
  if (task.status === 'progress') return { label: 'В процессе', tone: 'brand' }
  return { label: 'Сегодня', tone: 'neutral' }
}

export function taskCount(n) {
  return withPlural(n, 'задача', 'задачи', 'задач')
}

const STATUS_ORDER = { active: 0, done: 1, archived: 2 }

// Бэк отдаёт работы без orderBy, поэтому порядок задаём сами: сначала то,
// что в работе, внутри — новое сверху. Иначе список прыгает после каждого
// создания работы.
export function sortWorks(works) {
  return [...works].sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0) ||
      new Date(b.createdAt) - new Date(a.createdAt),
  )
}

export function tasksOfWork(tasks, workId) {
  return tasks.filter((t) => t.workId === workId)
}

// Вкладки с выбором отдела нужны только админу: остальным бэк и так отдаёт
// один их отдел.
export function visibleDepartments(departments, user) {
  if (user?.role === 'admin') return departments
  return departments.filter((d) => d.id === user?.departmentId)
}
