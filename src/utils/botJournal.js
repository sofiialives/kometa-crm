import { signedPoints } from './motivation'

/**
 * Как «Журнал бота» пишет время и события. Всё по Москве, как в CRM.
 */

const MSK = { timeZone: 'Europe/Moscow' }

/** «16:30». */
export function hm(value) {
  return value ? new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', ...MSK }) : ''
}

/** «Среда, 14 октября» из «2026-10-14». */
export function dayHeading(dayKey) {
  const d = new Date(`${dayKey}T12:00:00+03:00`)
  const t = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', ...MSK })
  return t[0].toUpperCase() + t.slice(1)
}

/** «31.10 23:50» — начало, которое было в прошлом месяце. */
function dateHm(value) {
  return new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', ...MSK }).replace(',', '')
}

/** «5 мин», «1 ч», «1 ч 20 мин», «меньше минуты». */
export function duration(minutes) {
  const m = Math.max(0, Math.round(minutes || 0))
  if (m < 1) return 'меньше минуты'
  if (m < 60) return `${m} мин`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} ч ${rest} мин` : `${h} ч`
}

/** «раз», «раза», «раз» после числа. */
export function times(n) {
  const a = Math.abs(n) % 100
  const b = a % 10
  return a > 10 && a < 20 ? 'раз' : b >= 2 && b <= 4 ? 'раза' : 'раз'
}

const quote = (text) => (text ? `«${text}»` : '')

/**
 * Строка события: { title, detail, tone }. detail — слова человека или
 * причина; руководителю сервер их не присылает, и строка без них.
 */
export function describe(item) {
  const d = item.data || {}
  switch (item.kind) {
    case 'break': {
      const end = item.returnedAt ? hm(item.returnedAt) : item.ongoing ? 'сейчас' : hm(item.until)
      const start = item.startedBefore ? `с ${dateHm(item.startedBefore)}` : hm(item.at)
      const parts = [`Отлучка ${start}–${end}, ${duration(item.minutes)}${item.startedBefore ? ' в этом месяце' : ''}`]
      if (item.lateMinutes) parts.push(`опоздание ${duration(item.lateMinutes)}`)
      if (item.extensions) parts.push(`продлевал(а) ${item.extensions} ${times(item.extensions)}`)
      if (item.ongoing) parts.push(`ждём к ${hm(item.until)}`)
      if (item.unmarked) parts.push('после не отметился(ась)')
      return {
        title: parts.join(' · '),
        detail: quote(item.reason),
        tone: item.unmarked || item.lateMinutes ? 'warn' : 'muted',
      }
    }
    case 'force_majeure':
      return {
        title: `Форс-мажор${item.startedBefore ? ` с ${dateHm(item.startedBefore)}` : ''} до ${dateHm(item.until)}${item.source === 'bot' ? ' · заявка из бота' : ' · поставлен в CRM'}${item.by ? `, ${item.by}` : ''}`,
        detail: quote(item.reason),
        tone: 'warn',
      }
    case 'checkin':
      if (item.status === 'answered') return { title: `Чек-ин ${hm(item.at)} · ответил(а) в ${hm(item.answeredAt)}`, detail: quote(item.answer), tone: 'ok' }
      if (item.status === 'penalized') {
        const fine = item.penaltyCancelled ? ' · штраф отменён' : item.points ? ` · ${signedPoints(item.points)}` : ' · в профиле нет штрафа'
        return { title: `Чек-ин ${hm(item.at)} · не ответил(а)${fine}`, detail: '', tone: item.penaltyCancelled ? 'muted' : 'danger' }
      }
      if (item.status === 'asked') return { title: `Чек-ин ${hm(item.at)} · ждём ответа`, detail: '', tone: 'muted' }
      return { title: `Чек-ин ${hm(item.at)} · не спрашивал`, detail: item.answer || '', tone: 'muted' }
    case 'late':
      return { title: `Задерживается${d.until ? ` до ${hm(d.until)}` : ''}`, detail: quote(item.text), tone: 'warn' }
    case 'task_late':
      return { title: `Не успевает начать «${d.taskTitle || 'задачу'}»${d.startAt ? ` (по плану в ${hm(d.startAt)})` : ''}`, detail: quote(item.text), tone: 'warn' }
    case 'task_take':
      return { title: `Взял(а) в работу «${d.taskTitle || 'задачу'}»`, detail: '', tone: 'ok' }
    case 'day_end':
      return { title: 'Закончил(а) рабочий день', detail: '', tone: 'muted' }
    case 'fm_request':
      return { title: 'Заявка на форс-мажор', detail: quote(item.text), tone: 'warn' }
    case 'fm_decision':
      return { title: d.approved ? `Форс-мажор подтверждён${d.until ? ` до ${hm(d.until)}` : ''}` : 'Форс-мажор не подтверждён', detail: d.by ? `решил(а) ${d.by}` : '', tone: d.approved ? 'ok' : 'danger' }
    default:
      return { title: item.kind, detail: '', tone: 'muted' }
  }
}
