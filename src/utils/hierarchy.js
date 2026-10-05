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
  // Было "Сегодня" — но это статус "ещё не взято в работу", а не дата:
  // в Иерархии задачи ставят и на будущие дни, не только на сегодня.
  return { label: 'К выполнению', tone: 'neutral' }
}

export function taskCount(n) {
  return withPlural(n, 'задача', 'задачи', 'задач')
}

// Бейдж для схлопнутой группы задач (один и тот же тайтл на нескольких
// исполнителей): пока хоть один не готов — группа не «Готово»; если среди
// незавершённых есть просроченная — показываем это первым делом, это
// важнее, чем «в процессе».
export function aggregateTaskBadge(tasks) {
  if (tasks.every((t) => t.status === 'done')) return { label: 'Готово', tone: 'ok' }
  if (tasks.some((t) => isOverdue(t))) return { label: 'Срок прошёл', tone: 'warn' }
  if (tasks.some((t) => t.status === 'progress')) return { label: 'В процессе', tone: 'brand' }
  return { label: 'К выполнению', tone: 'neutral' }
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

// ---------------------------------------------------------------------
// Порядок задач внутри работы
// ---------------------------------------------------------------------

function taskCreatedAtMs(t) {
  if (t.createdAt) {
    const ms = new Date(t.createdAt).getTime()
    if (!Number.isNaN(ms)) return ms
  }
  return null
}

// Бэк отдаёт задачи работы без orderBy — так же, как и работы (см.
// sortWorks выше), поэтому список после каждой перезагрузки/создания
// прыгает в разброс. По умолчанию сортируем по времени создания: старые
// сверху, последняя созданная задача — снизу.
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const am = taskCreatedAtMs(a)
    const bm = taskCreatedAtMs(b)
    if (am != null && bm != null) return am - bm
    if (am != null) return -1
    if (bm != null) return 1
    // Совсем нет даты — не ломаем порядок с бэка (sort стабилен),
    // просто не даём двум записям без даты встать в случайном месте.
    return 0
  })
}

// Ручной порядок, который админ/глава отдела задают перетаскиванием.
// Бэк не отдаёт поле order на задаче, поэтому храним расстановку в
// localStorage (per-браузер) и накладываем её поверх сортировки по
// времени создания. Единица порядка — «строка» (см. groupTasksForDisplay
// ниже): обычная задача или группа задач, созданных на нескольких
// исполнителей разом, — такая группа двигается и хранится как единое целое.
const ORDER_STORAGE_KEY = 'kometa:hierarchy-task-order'

function readOrderStore() {
  try {
    return JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeOrderStore(map) {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // localStorage недоступен (приватный режим, квота и т.п.) — порядок
    // просто не переживёт перезагрузку, но на текущей сессии работает.
  }
}

export function getRowOrder(workId) {
  return readOrderStore()[workId] || []
}

export function setRowOrder(workId, rowKeys) {
  const map = readOrderStore()
  map[workId] = rowKeys
  writeOrderStore(map)
}

// Задачи, которые админ поставил разом на нескольких исполнителей,
// бэк заводит как отдельные записи — по одной на каждого (см. комментарий
// в AddTaskModal/tasksStore). В общем списке работы это выглядит как
// дубль одной и той же задачи. Схлопываем визуально те записи, что
// совпадают по содержимому и созданы в одном и том же действии (окно в
// несколько секунд) — остальной код по-прежнему работает с исходными
// отдельными задачами (toggle/edit/delete идут по конкретной задаче).
function contentKey(t) {
  const base = [t.title.trim(), (t.description || '').trim(), t.deadline, t.priority].join('|')
  const ms = taskCreatedAtMs(t)
  if (ms == null) return base
  return base + '|' + Math.floor(ms / 5000)
}

// Возвращает строки для отрисовки: { rowKey, isGroup, tasks }.
// tasks.length === 1 для обычной задачи, > 1 — для схлопнутой группы.
export function groupTasksForDisplay(sortedTasks) {
  const buckets = new Map()
  const firstIndex = new Map()

  sortedTasks.forEach((t, i) => {
    const key = contentKey(t)
    if (!buckets.has(key)) {
      buckets.set(key, [])
      firstIndex.set(key, i)
    }
    buckets.get(key).push(t)
  })

  return [...buckets.entries()]
    .sort((a, b) => firstIndex.get(a[0]) - firstIndex.get(b[0]))
    .map(([key, members]) =>
      members.length > 1
        ? { rowKey: `group:${key}`, isGroup: true, tasks: members }
        : { rowKey: members[0].id, isGroup: false, tasks: members },
    )
}

// Накладывает сохранённый ручной порядок на строки, уже отсортированные
// по времени. Новые строки (которых ещё нет в сохранённом порядке) едут
// в конец — там же, где их и поставила сортировка по дате.
export function applyRowOrder(rows, workId) {
  const saved = getRowOrder(workId)
  if (saved.length === 0) return rows

  const byKey = new Map(rows.map((r) => [r.rowKey, r]))
  const ordered = []
  for (const key of saved) {
    const r = byKey.get(key)
    if (r) {
      ordered.push(r)
      byKey.delete(key)
    }
  }
  for (const r of byKey.values()) ordered.push(r)
  return ordered
}

// Перетаскивание: переставляет rowKey fromKey на место toKey и сохраняет
// получившийся порядок для этой работы.
export function reorderRows(rows, workId, fromKey, toKey) {
  const keys = rows.map((r) => r.rowKey)
  const fromIdx = keys.indexOf(fromKey)
  const toIdx = keys.indexOf(toKey)
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return rows

  keys.splice(toIdx, 0, keys.splice(fromIdx, 1)[0])
  setRowOrder(workId, keys)

  const byKey = new Map(rows.map((r) => [r.rowKey, r]))
  return keys.map((k) => byKey.get(k)).filter(Boolean)
}
