/** Общие мелочи Доски клиентов. */

/**
 * Деньги приходят с сервера в центах целым числом. Показываем долларами.
 * Центы без копеек — они у агентства круглые, и «$3 800» читается быстрее,
 * чем «$3 800,00». Копейки показываем, только если они есть.
 */
export function money(cents) {
  const v = (cents || 0) / 100
  const fraction = Math.abs(v % 1) > 0.004 ? 2 : 0
  return `$${v.toLocaleString('ru-RU', { minimumFractionDigits: fraction, maximumFractionDigits: 2 })}`
}

/** «октябрь 2026» — подпись месяца, к которому привязана услуга. */
export function monthLabel(value) {
  return new Date(value)
    .toLocaleDateString('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(/\s*г\.$/, '')
}

/** Значение для поля месяца: первое число, ГГГГ-ММ-01. */
export function monthKey(value = new Date()) {
  const d = new Date(value)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

export function dayKey(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10)
}

export function dateLabel(value) {
  if (!value) return ''
  return new Date(value)
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(/\s*г\.$/, '')
}

/**
 * «115 дней», «8 месяцев», «1 год 2 месяца».
 *
 * В задании написано «сколько дней/месяцев клиент уже с нами». Двести
 * пятьдесят три дня глазами не читаются — с какого-то момента месяцы
 * понятнее, а после года понятнее годы.
 */
export function tenure(days) {
  if (days < 60) return daysWord(days)
  const months = Math.floor(days / 30.44)
  if (months < 12) return monthsWord(months)
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest ? `${yearsWord(years)} ${monthsWord(rest)}` : yearsWord(years)
}

const plural = (n, one, few, many) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} ${few}`
  return `${n} ${many}`
}

export const monthsWord = (n) => plural(n, 'месяц', 'месяца', 'месяцев')

/** Подпись скользящего окна на карточках: «3 месяца», «год». */
export function lastLabel(months) {
  const n = Number(months) || 3
  return n === 12 ? 'год' : monthsWord(n)
}
export const yearsWord = (n) => plural(n, 'год', 'года', 'лет')

/** «115 дней», «1 день», «22 дня» — иначе в интерфейсе появляется «1 дней». */
export function daysWord(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} день`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} дня`
  return `${n} дней`
}

export function servicesWord(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} услуга`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} услуги`
  return `${n} услуг`
}

/**
 * Месяцы для выпадающего списка: последний год плюс следующий месяц.
 *
 * Следующий нужен потому, что за услугу платят вперёд, и занести её месяцем
 * раньше, чем он наступил, — обычное дело.
 */
export function recentMonths(count = 12) {
  const now = new Date()
  return Array.from({ length: count + 1 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1 - i, 1))
    return { value: monthKey(d), label: monthLabel(d) }
  })
}

/**
 * Список месяцев для переключателя: те, по которым есть данные, плюс
 * ближайший год, плюс обязательно выбранный сейчас.
 *
 * Последнее важно: без него выбранный месяц, которого нет в списке, просто
 * не находится, и браузер молча показывает первую строку. Доска при этом
 * считает правильный месяц, а подпись врёт — поймать такое глазами тяжело.
 */
export function monthOptions(withData = [], selected) {
  const map = new Map()
  for (const m of [...withData.map(monthKey), ...recentMonths().map((o) => o.value), selected]) {
    if (m) map.set(m, { value: m, label: monthLabel(m) })
  }
  return [...map.values()].sort((a, b) => b.value.localeCompare(a.value))
}
