import { withPlural } from '../shared/lib/plural'

export const ROLES = [
  { value: 'staff', label: 'Сотрудник' },
  { value: 'lead', label: 'Главный отдела' },
  { value: 'admin', label: 'Администратор' },
]

const ROLE_LABEL = { admin: 'Админ', lead: 'Главный', staff: 'Сотрудник' }
const ROLE_TONE = { admin: 'brand', lead: 'brand', staff: 'neutral' }

export function roleBadge(role) {
  return { label: ROLE_LABEL[role] || role, tone: ROLE_TONE[role] || 'neutral' }
}

// Состояний три, а не два: уволен, приглашён (почта заведена, но человек ещё
// ни разу не заходил) и активен.
export function userStatus(user) {
  if (!user.active) return { label: 'Доступ отозван', tone: 'danger' }
  if (user.status === 'invited') return { label: 'Не заходил', tone: 'warn' }
  return { label: 'Активен', tone: 'ok' }
}

// Пока человек не вошёл, бэк держит в name первую букву почты. У исполнителей
// работы почты в ответе нет вообще — отсюда последняя ступень.
export function displayName(user) {
  if (!user) return 'Без имени'
  const name = (user.name || '').trim()
  if (name.length > 1) return name
  return user.email || name || 'Без имени'
}

export function memberCount(n) {
  return withPlural(n, 'человек', 'человека', 'человек')
}

export function membersOf(users, departmentId) {
  return users.filter((u) => u.departmentId === departmentId && u.active)
}

// Главный берётся из department.leadId, а не из роли: роль lead может остаться
// у человека после перевода, а руководит отделом тот, кто записан в отделе.
export function splitByLead(members, department) {
  const lead = members.find((u) => u.id === department.leadId) || null
  const staff = members.filter((u) => u.id !== lead?.id)
  return { lead, staff }
}
