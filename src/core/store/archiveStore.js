import { create } from 'zustand'
import { api } from '../api/client'

/**
 * Свой стор, а не общий с клиентами и работами.
 *
 * В проекте уже был случай, когда два экрана делили один массив и
 * показывали друг другу чужие данные. Архив тем более живёт отдельно:
 * у него своя видимость по отделам и свой объём, который со временем
 * только растёт.
 *
 * Видимость целиком на сервере (archive.service.js) — здесь лежит то,
 * что он вернул, и правила не дублируются.
 */

function query(params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export const useArchiveStore = create((set, get) => ({
  clients: [],
  // Раскрытая карточка клиента: услуги и отчёты внутри них.
  openClient: null,
  reports: [],
  reportsTotal: 0,
  authors: [],
  // Названия услуг для фильтра. Берутся из самих услуг, а не из отчётов:
  // только что заведённая услуга ещё без отчётов, но в фильтре быть должна.
  serviceTitles: [],
  loading: false,
  error: null,

  async fetchClients({ departmentId, q, serviceTitle } = {}) {
    set({ loading: true, error: null })
    try {
      const clients = await api.get(`/archive/clients${query({ departmentId, q, serviceTitle })}`)
      set({ clients, loading: false })
      return { ok: true }
    } catch (e) {
      set({ error: e.message, loading: false })
      return { ok: false, error: e.message }
    }
  },

  async fetchClient(id) {
    try {
      const openClient = await api.get(`/archive/clients/${id}`)
      set({ openClient })
      return { ok: true, data: openClient }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  closeClient: () => set({ openClient: null }),

  // Отдел — та вкладка, на которой стоит человек: архив у каждого отдела
  // свой, и клиент заносится именно в него. Без отдела (админ на «Все
  // отделы») выйдет заготовка, которую заберёт первый отдел с услугой.
  async addClient(clientId, departmentId) {
    try {
      await api.post('/archive/clients', { clientId, ...(departmentId ? { departmentId } : {}) })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async removeClient(id) {
    try {
      await api.del(`/archive/clients/${id}`)
      set({ clients: get().clients.filter((c) => c.id !== id), openClient: null })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async createService(payload) {
    try {
      await api.post('/archive/services', payload)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async editService(id, title) {
    try {
      await api.patch(`/archive/services/${id}`, { title })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async removeService(id) {
    try {
      await api.del(`/archive/services/${id}`)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  /**
   * Поиск по отчётам. Постранично: архив не чистится и растёт вечно,
   * поэтому «дозагрузить» вместо «загрузить всё».
   */
  async fetchReports(filters = {}, { append = false } = {}) {
    set({ loading: true, error: null })
    try {
      const { items, total } = await api.get(`/archive/reports${query(filters)}`)
      set({
        reports: append ? [...get().reports, ...items] : items,
        reportsTotal: total,
        loading: false,
      })
      return { ok: true }
    } catch (e) {
      set({ error: e.message, loading: false })
      return { ok: false, error: e.message }
    }
  },

  async fetchServiceTitles(departmentId) {
    try {
      set({ serviceTitles: await api.get(`/archive/services${query({ departmentId })}`) })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async fetchAuthors(departmentId) {
    try {
      set({ authors: await api.get(`/archive/authors${query({ departmentId })}`) })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async uploadReport({ serviceId, workedAt, file }) {
    const form = new FormData()
    form.append('serviceId', serviceId)
    if (workedAt) form.append('workedAt', workedAt)
    form.append('file', file)
    try {
      await api.upload('/archive/reports', form)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async removeReport(id) {
    try {
      await api.del(`/archive/reports/${id}`)
      set({ reports: get().reports.filter((r) => r.id !== id) })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  /**
   * Достать файл с сервера.
   *
   * Прямой ссылки на отчёт не существует: он закрыт токеном и отдаётся
   * нашим сервером после проверки отдела, а тег <a href> заголовок
   * авторизации не отправит. Поэтому тянем содержимое сами и дальше
   * работаем с ним из памяти браузера.
   */
  async openReportFile(id, fileName, { download = false } = {}) {
    try {
      const blob = await api.blob(`/archive/reports/${id}/file`)
      const url = URL.createObjectURL(blob)

      if (download) {
        const a = document.createElement('a')
        a.href = url
        a.download = fileName || 'отчёт.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        const win = window.open(url, '_blank', 'noopener')
        // Всплывающее окно могли заблокировать — тогда сохраняем файл,
        // это лучше, чем молча ничего не сделать.
        if (!win) {
          const a = document.createElement('a')
          a.href = url
          a.download = fileName || 'отчёт.pdf'
          document.body.appendChild(a)
          a.click()
          a.remove()
        }
      }

      // Ссылку держим до закрытия вкладки: отозвать сразу — значит
      // закрыть документ у человека перед носом или оборвать сохранение.
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },
}))
