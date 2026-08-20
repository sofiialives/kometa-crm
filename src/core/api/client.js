import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, { method = 'GET', body, headers = {} } = {}) {
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

  if (res.status === 401 && path !== '/auth/login') {
    useAuthStore.getState().logout()
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error?.message || `Ошибка ${res.status}`)
  }

  return res.status === 204 ? null : res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
}
