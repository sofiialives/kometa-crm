import { useUsersStore } from './usersStore'
import { useDepartmentsStore } from './departmentsStore'

/**
 * Главный отдела живёт в двух местах: роль у пользователя и leadId у отдела.
 * Держим их в одном месте, потому что назначают главного из двух экранов.
 */

// Порядок важен: сначала назначаем нового, потом понижаем старого. Транзакции
// на два запроса нет, и при обратном порядке обрыв посередине оставил бы отдел
// вообще без главного.
export async function setLead(departmentId, userId) {
  const { departments, updateDepartment } = useDepartmentsStore.getState()
  const previous = departments.find((d) => d.id === departmentId)?.leadId

  const linked = await updateDepartment(departmentId, { leadId: userId })
  if (!linked.ok || !previous || previous === userId) return linked

  return useUsersStore.getState().updateUser(previous, { role: 'staff', position: null })
}

// Бэк выставляет приглашённому роль и должность «Начальник отдела», но leadId
// у отдела не трогает. Без этого шага отдел показывался бы «без главного»,
// хотя в списке уже стоит человек с ролью lead.
export async function inviteMember(payload) {
  const res = await useUsersStore.getState().inviteUser(payload)
  if (!res.ok || payload.role !== 'lead') return res

  const linked = res.user?.id
    ? await setLead(payload.departmentId, res.user.id)
    : { ok: false }
  if (linked.ok) return res

  // Сотрудник уже создан, повторить приглашение нельзя — почта занята.
  // Поэтому говорим, что делать дальше, а не просто отдаём ошибку сети.
  return {
    ok: false,
    error: 'Сотрудник приглашён, но назначить его главным не удалось. Закройте окно и назначьте через меню сотрудника.',
  }
}
