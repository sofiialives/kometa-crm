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

/**
 * В отличие от buildTodayDeadlineMsk (доска «Задачи», всегда сегодня),
 * здесь дату выбирают явно — Иерархии нужны сроки на будущие дни,
 * не только на сегодня.
 */
export function buildDeadlineMsk(dateStr, hhmm) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || '')) throw new Error('invalid date')
  if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(hhmm || '')) throw new Error('invalid time')

  const [y, mo, da] = dateStr.split('-').map(Number)
  const [h, m] = hhmm.split(':').map(Number)

  const utcMs = Date.UTC(y, mo - 1, da, h, m, 0, 0) - MSK_OFFSET_MS
  return new Date(utcMs).toISOString()
}

export function defaultMskDateValue() {
  const d = new Date(Date.now() + MSK_OFFSET_MS)
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const da = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${mo}-${da}`
}

/** Для предзаполнения полей при продлении срока уже существующей задачи. */
export function splitDeadlineMsk(iso) {
  const d = new Date(iso)
  const mskMs = d.getTime() + MSK_OFFSET_MS
  const mskD = new Date(mskMs)
  const y = mskD.getUTCFullYear()
  const mo = String(mskD.getUTCMonth() + 1).padStart(2, '0')
  const da = String(mskD.getUTCDate()).padStart(2, '0')
  const hh = String(mskD.getUTCHours()).padStart(2, '0')
  const mm = String(mskD.getUTCMinutes()).padStart(2, '0')
  return { date: `${y}-${mo}-${da}`, time: `${hh}:${mm}` }
}

export function formatMskTime(iso) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: MSK_TZ })
}

export function formatMskDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: MSK_TZ })
}

/** Совпадает ли дата задачи (по МСК) с сегодняшним днём (по МСК). */
export function isTodayMsk(iso) {
  const target = new Date(iso).toLocaleDateString('ru-RU', { timeZone: MSK_TZ })
  const today = new Date().toLocaleDateString('ru-RU', { timeZone: MSK_TZ })
  return target === today
}

export function scopeHint(user) {
  if (!user) return ''
  if (user.role === 'admin') return 'Вкладки переключают отделы. Двигать можно только свои задачи.'
  if (user.role === 'lead') return 'Вы видите задачи всего отдела, но двигать можно только свои.'
  return 'Вы видите и двигаете только свои задачи.'
}

/** Единый источник подписей/цветов приоритета — переиспользуется везде,
 * где задача создаётся или показывается (доска, Иерархия, карточки). */
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Низкий', tone: 'neutral' },
  { value: 'medium', label: 'Средний', tone: 'warn' },
  { value: 'high', label: 'Высокий', tone: 'danger' },
]

export function priorityMeta(priority) {
  return PRIORITY_OPTIONS.find((p) => p.value === priority) || PRIORITY_OPTIONS[1]
}
