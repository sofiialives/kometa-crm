import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Несколько запросов могут словить 401 одновременно (например, страница
// с параллельными fetchUsers/fetchDepartments/fetchTasks при истёкшем
// access-токене) — без этой блокировки каждый из них попытался бы
// обновить токен сам по себе. Одна попытка обновления на всех, остальные
// ждут её результата.
let refreshInFlight = null

async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) throw new Error('Нет refresh-токена')

      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) throw new Error('Refresh не прошёл')

      const data = await res.json()
      useAuthStore.getState().setTokens(data)
      return data.accessToken
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

async function request(path, { method = 'GET', body, headers = {} } = {}, isRetry = false) {
  const token = useAuthStore.getState().token
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const isAuthRoute = path === '/auth/login' || path === '/auth/refresh' || path === '/auth/google'

  if (res.status === 401 && !isAuthRoute) {
    // Первый раз на этом запросе — не сдаёмся сразу. Access-токен живёт
    // 15 минут, это истекает в середине обычной сессии постоянно, а не
    // значит, что человека реально нужно выкинуть с сайта.
    if (!isRetry) {
      try {
        await refreshAccessToken()
        return request(path, { method, body, headers }, true)
      } catch {
        useAuthStore.getState().logout()
      }
    } else {
      // Не помог даже свежий токен — значит и refresh-токен просрочен
      // или отозван, тут разлогин уже обоснован.
      useAuthStore.getState().logout()
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const err = new Error(data?.error?.message || `Ошибка ${res.status}`)
    err.status = res.status
    err.details = data?.error?.details
    throw err
  }

  return res.status === 204 ? null : res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
}
