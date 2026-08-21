import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../api/client'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,

      isAuthed: () => Boolean(get().token),
      isAdmin: () => get().user?.role === 'admin',
      isLead: () => get().user?.role === 'lead',

      async login({ email, password }) {
        set({ loading: true, error: null })
        try {
          const { user, accessToken, refreshToken } = await api.post('/auth/login', { email, password })
          set({ user, token: accessToken, refreshToken, loading: false })
          return { ok: true }
        } catch (e) {
          set({ error: e.message, loading: false })
          return { ok: false, error: e.message }
        }
      },

      async loginWithGoogle(idToken) {
        set({ loading: true, error: null })
        try {
          const { user, accessToken, refreshToken } = await api.post('/auth/google', { idToken })
          set({ user, token: accessToken, refreshToken, loading: false })
          return { ok: true }
        } catch (e) {
          set({ error: e.message, loading: false })
          return { ok: false, error: e.message }
        }
      },

      async forgotPassword(email) {
        set({ loading: true, error: null })
        try {
          await api.post('/auth/forgot-password', { email })
          set({ loading: false })
          return { ok: true }
        } catch (e) {
          set({ error: e.message, loading: false })
          return { ok: false, error: e.message }
        }
      },

      async resetPassword({ email, code, newPassword }) {
        set({ loading: true, error: null })
        try {
          const { user, accessToken, refreshToken } = await api.post('/auth/reset-password', {
            email,
            code,
            newPassword,
          })
          set({ user, token: accessToken, refreshToken, loading: false })
          return { ok: true }
        } catch (e) {
          set({ error: e.message, loading: false })
          return { ok: false, error: e.message }
        }
      },

      logout() {
        api.post('/auth/logout', {}).catch(() => {})
        set({ user: null, token: null, refreshToken: null, error: null })
      },

      /**
       * После первого входа бэк держит в name только первую букву почты —
       * этим методом человек один раз ставит своё настоящее имя, и оно
       * дальше отображается везде (аватарки, списки, задачи).
       */
      async updateName(name) {
        set({ error: null })
        try {
          const updated = await api.patch('/auth/me', { name })
          set({ user: { ...get().user, ...updated } })
          return { ok: true }
        } catch (e) {
          set({ error: e.message })
          return { ok: false, error: e.message }
        }
      },

      /** Страница настроек: имя, фото (data URL), цвет кружка-аватарки. */
      async updateProfile(patch) {
        set({ error: null })
        try {
          const updated = await api.patch('/auth/me', patch)
          set({ user: { ...get().user, ...updated } })
          return { ok: true }
        } catch (e) {
          set({ error: e.message })
          return { ok: false, error: e.message }
        }
      },

      async changePassword({ currentPassword, newPassword }) {
        try {
          await api.patch('/auth/me/password', { currentPassword, newPassword })
          return { ok: true }
        } catch (e) {
          return { ok: false, error: e.message }
        }
      },
    }),
    { name: 'kometa-crm-auth', partialize: (s) => ({ user: s.user, token: s.token, refreshToken: s.refreshToken }) },
  ),
)
