export const COLUMNS = [
  { key: 'today', title: 'Сегодня', next: 'progress', nextLabel: 'В процесс' },
  { key: 'progress', title: 'В процессе', prev: 'today', next: 'done', nextLabel: 'Готово' },
  { key: 'done', title: 'Готово', prev: 'progress' },
]

export const REFRESH_MS = 60_000
export const MSK_TZ = 'Europe/Moscow'
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000

export function buildTodayDeadlineMsk(hhmm) {
  if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(hhmm || '')) throw new Error('invalid time')
  const [h, m] = hhmm.split(':').map(Number)

  const mskNow = new Date(Date.now() + MSK_OFFSET_MS)
  const y = mskNow.getUTCFullYear()
  const mo = mskNow.getUTCMonth()
  const da = mskNow.getUTCDate()

  const utcMs = Date.UTC(y, mo, da, h, m, 0, 0) - MSK_OFFSET_MS
  return new Date(utcMs).toISOString()
}

export function defaultMskTimeValue() {
  const d = new Date(Date.now() + MSK_OFFSET_MS + 30 * 60 * 1000)
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function formatMskTime(iso) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: MSK_TZ })
}

export function formatMskDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: MSK_TZ })
}

export function scopeHint(user) {
  if (!user) return ''
  if (user.role === 'admin') return 'Вкладки переключают отделы. Двигать можно только свои задачи.'
  if (user.role === 'lead') return 'Вы видите задачи всего отдела, но двигать можно только свои.'
  return 'Вы видите и двигаете только свои задачи.'
}
