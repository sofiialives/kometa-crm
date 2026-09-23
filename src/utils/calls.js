import { MSK_OFFSET_MS, MSK_TZ } from './tasks'

export const CALLS_REFRESH_MS = 60_000

const DAY_MS = 24 * 60 * 60 * 1000
const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const pad = (n) => String(n).padStart(2, '0')

/**
 * Вся арифметика дат идёт в «сдвинутом» времени: к UTC прибавляем +3 и
 * дальше пользуемся только getUTC*-методами. Так день считается по
 * Москве независимо от того, где стоит браузер сотрудника — иначе
 * человек из другого часового пояса видел бы чужую неделю.
 */
function mskShifted(value) {
  return new Date((value === undefined ? Date.now() : new Date(value).getTime()) + MSK_OFFSET_MS)
}

function dayKeyOf(shifted) {
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`
}

/** День звонка по МСК в виде YYYY-MM-DD — ключ, по которому карточки раскладываются по колонкам. */
export function callDayKey(iso) {
  return dayKeyOf(mskShifted(iso))
}

/** Сегодняшний день по МСК. */
export function todayKey() {
  return dayKeyOf(mskShifted())
}

/**
 * Семь дней недели, Пн–Вс. offset сдвигает на недели: 0 — текущая,
 * 1 — следующая, -1 — прошлая.
 *
 * getUTCDay() отдаёт 0 для воскресенья, поэтому приводим к понедельнику
 * через (day + 6) % 7 — иначе воскресенье уехало бы в начало недели, и
 * человек в выходной видел бы неделю, которая уже закончилась.
 */
export function weekDays(offset = 0) {
  const now = mskShifted()
  const shiftToMonday = (now.getUTCDay() + 6) % 7
  const mondayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    - shiftToMonday * DAY_MS
    + offset * 7 * DAY_MS

  const today = todayKey()

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayMs + i * DAY_MS)
    const key = dayKeyOf(d)
    return {
      key,
      name: DAY_NAMES[i],
      dayNum: d.getUTCDate(),
      // Именно «25 сентября», а не «сентябрь»: русский месяц встаёт в
      // родительный падеж только вместе с числом, поэтому форматируем
      // пару целиком, а не один месяц.
      full: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }),
      isToday: key === today,
      isPast: key < today,
      isWeekend: i >= 5,
    }
  })
}

/** Подпись диапазона недели: «22 – 28 сентября» или «29 сентября – 5 октября». */
export function weekLabel(offset = 0) {
  const days = weekDays(offset)
  const first = days[0]
  const last = days[6]
  // Внутри одного месяца название не повторяем: «21 – 27 сентября».
  // На стыке месяцев оно нужно с обеих сторон: «28 сентября – 4 октября».
  const sameMonth = monthOf(first.full) === monthOf(last.full)
  return `${sameMonth ? first.dayNum : first.full} – ${last.full}`
}

function monthOf(full) {
  return full.replace(/^\d+\s/, '')
}

/** Звонок стоит на сегодня (по МСК). */
export function isTodayCall(iso) {
  return callDayKey(iso) === todayKey()
}

/** Звонок уже прошёл — карточка гаснет и получает пометку. Ночью такие удаляются. */
export function isPastCall(iso) {
  return new Date(iso).getTime() < Date.now()
}

/** Время звонка по МСК, HH:MM. */
export function callTime(iso) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: MSK_TZ })
}

export function callsScopeHint(user) {
  if (!user) return ''
  if (user.role === 'admin') return 'Свои звонки и вкладка со звонками всего агентства.'
  if (user.role === 'lead') return 'Вы видите звонки всего отдела, но менять можно только свои.'
  return 'Вы видите и ставите только свои звонки.'
}

/**
 * «Николай Волков» → «Николай В.». В колонку шириной 159px полное имя не
 * помещается и обрезается многоточием на середине фамилии — сокращение
 * читается лучше, чем «Николай Во…». Полное имя остаётся в подсказке.
 */
export function shortName(full) {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'Без имени'
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`
}
