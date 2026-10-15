/**
 * Общие мелочи вкладки «Мотивация»: подписи, деньги, баллы, месяцы.
 *
 * Все расчёты — на сервере. Здесь только то, как готовые цифры выглядят
 * на экране: если считать баллы ещё и в браузере, две арифметики однажды
 * разойдутся, и никто не поймёт, какая из них права.
 */
import { money } from './board'
import { plural, withPlural } from '../shared/lib/plural'
import { todayKey } from './calls'

export { money }

/** Деньги без копеек: суммы уровней на шкале всегда целые доллары. */
export function dollars(cents) {
  return money(Math.round((cents || 0) / 100) * 100)
}

/** Баллы со знаком: «+2», «−3», «0». Минус — настоящий, не дефис. */
export function signedPoints(n) {
  if (!n) return '0'
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`
}

export const pointsWord = (n) => withPlural(n, 'балл', 'балла', 'баллов')
export const pointsUnit = (n) => plural(n, 'балл', 'балла', 'баллов')
/** «не больше 2 баллов», «не больше 1 балла»: после «больше» — родительный падеж. */
export const atMostPoints = (n) => `не больше ${n} ${n % 10 === 1 && n % 100 !== 11 ? 'балла' : 'баллов'}`
export const employeesWord = (n) => withPlural(n, 'сотрудник', 'сотрудника', 'сотрудников')

/** «ноябрь 2026» из «2026-11». */
export function monthTitle(key) {
  if (!key) return ''
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1))
    .toLocaleDateString('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .replace(/\s*г\.$/, '')
}

/** То же, с заглавной буквы — для заголовков. */
export function monthHeading(key) {
  const t = monthTitle(key)
  return t ? t[0].toUpperCase() + t.slice(1) : t
}

/** «12 ноября, 14:05» по Москве: так показывается время во всей CRM. */
export function dateTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
  })
}

/** «1 ноября» — для «Условия обновлены …». */
export function dayMonth(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' })
}

/** Первое число следующего месяца по Москве, «ГГГГ-ММ-ДД»: так запускаются автобаллы по умолчанию. */
export function nextMonthStartKey(today = todayKey()) {
  const [y, m] = today.split('-').map(Number)
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`
}

/**
 * Подпись автособытия в условиях: работает ли оно уже. Без неё «+2 за
 * задачу в срок» читалось бы как обещание, которое пока не выполняется.
 */
export function autoStatusLabel(rules, event) {
  const base = event?.review ? 'По задачам, начисляет владелец после проверки' : 'Автоматически по задачам'
  if (rules?.autoTasksOn) return base
  if (rules?.autoTasksFrom) return `${base}, начнёт работать ${dayMonth(rules.autoTasksFrom)}`
  return `${base}, пока не включено`
}

// Потолок суммы одной операции — тот же, что проверяет сервер.
export const MAX_DOLLARS = 1_000_000

export const BANK_REASONS = [
  { value: 'new_client', label: 'Новый клиент' },
  { value: 'free_budget', label: 'Свободный бюджет' },
  { value: 'other', label: 'Другое' },
]

const REASON_LABEL = Object.fromEntries(BANK_REASONS.map((r) => [r.value, r.label]))

/** Подпись записи банка: почему деньги пришли или ушли. */
export function bankEntryLabel(entry) {
  if (entry.kind === 'start') return 'Стартовая сумма месяца'
  if (entry.kind === 'write_off') return 'Списание из банка'
  return REASON_LABEL[entry.reason] || 'Пополнение'
}

export const AUTO_RULES = [
  { value: 'task_on_time', label: 'Задача из Иерархии закрыта в срок' },
  { value: 'personal_task_on_time', label: 'Личная задача закрыта в срок' },
  { value: 'task_overdue', label: 'Просрочка задачи из Иерархии, за каждый день' },
  { value: 'personal_task_overdue', label: 'Просрочка личной задачи, один раз' },
  { value: 'task_not_started', label: 'Задача не начата вовремя, через 15 минут после начала' },
]

const RULE_LABEL = Object.fromEntries(AUTO_RULES.map((r) => [r.value, r.label]))
export const autoRuleLabel = (rule) => RULE_LABEL[rule] || ''

/**
 * Первая буква строчная, остальное как есть. Нужен вместо toLowerCase():
 * тот превращал «Иерархию» — название вкладки — в «иерархию».
 */
export function lowerFirst(text) {
  return text ? text[0].toLowerCase() + text.slice(1) : text
}

/**
 * Метка отлучки: «отошёл до 16:30» — человек сам написал боту, «форс-мажор
 * до …» — поставил владелец или подтвердил по заявке из бота.
 */
export function awayLabel(away) {
  return away?.kind === 'break' ? 'отошёл до' : 'форс-мажор до'
}

/** Как фиксируется событие — словами для «Моих условий». */
export function modeLabel(type) {
  if (type.systemKey === 'call_attended' || type.systemKey === 'call_missed') return 'Отмечает владелец в журнале звонка'
  if (type.systemKey === 'checkin_missed') return 'Снимает бот, если не ответить на внезапный чек-ин за 45 минут'
  return type.mode === 'auto' ? 'Автоматически по задачам' : 'Отмечает владелец'
}

/** Чем является запись истории — короткая метка рядом с названием. */
export function entryKindLabel(entry) {
  if (entry.kind === 'adjustment') return 'Корректировка'
  if (entry.kind === 'product') return 'Продажа'
  return entry.mode === 'auto' ? 'Автоматически' : 'Вручную'
}

/**
 * Баллы события в одну строку. Если в премию и в уровень одинаково — одно
 * число; если по-разному, показываем оба, иначе разница потеряется.
 */
export function eventPoints(e) {
  if (e.prizePoints === e.levelPoints) return signedPoints(e.prizePoints)
  return `${signedPoints(e.prizePoints)} в премию, ${signedPoints(e.levelPoints)} в уровень`
}

/** Цвет числа баллов: плюс зелёный, минус красный, как в задании. */
export function pointsTone(n) {
  if (n > 0) return 'text-ok'
  if (n < 0) return 'text-danger'
  return 'text-ink-3'
}

/** Текст пустого банка — слово в слово из задания. */
export const EMPTY_BANK_TEXT = 'Банк пока пуст. Он пополняется, когда появляются клиенты и свободный бюджет'

/**
 * Проверка шкалы премии до отправки. Те же правила, что на сервере, и тем
 * же языком: ошибка видна сразу, без похода на сервер. Сервер всё равно
 * проверяет сам — эта проверка для удобства, а не для защиты.
 */
export function scaleErrors(levels) {
  const errors = []
  if (levels.length === 0) return ['В шкале должен быть хотя бы один уровень']
  levels.forEach((l, i) => {
    const n = i + 1
    if (!Number.isInteger(l.threshold) || l.threshold < 1 || l.threshold > 100) {
      errors.push(`Уровень ${n}: порог должен быть целым числом от 1 до 100`)
    }
    if (!Number.isInteger(l.percent) || l.percent < 1 || l.percent > 100) {
      errors.push(`Уровень ${n}: доля банка должна быть целым числом от 1 до 100`)
    }
    if (i > 0) {
      if (l.threshold <= levels[i - 1].threshold) errors.push(`Уровень ${n}: порог должен быть больше, чем у уровня ${n - 1}`)
      if (l.percent <= levels[i - 1].percent) errors.push(`Уровень ${n}: доля должна быть больше, чем у уровня ${n - 1}`)
    }
  })
  return errors
}

/** То же для уровней работы: первый с нуля, границы растут, названия есть. */
export function workLevelErrors(levels) {
  const errors = []
  if (levels.length === 0) return ['Нужен хотя бы один уровень работы']
  levels.forEach((l, i) => {
    const n = i + 1
    if (!String(l.title || '').trim()) errors.push(`Уровень ${n}: нужно название`)
    if (!Number.isInteger(l.minPoints) || l.minPoints < 0 || l.minPoints > 100) {
      errors.push(`Уровень ${n}: граница должна быть целым числом от 0 до 100`)
    }
    if (i > 0 && l.minPoints <= levels[i - 1].minPoints) errors.push(`Уровень ${n}: граница должна быть больше, чем у уровня ${n - 1}`)
  })
  return errors
}

/**
 * Ключ формы против повторной отправки. Придумывается при каждом открытии
 * формы и уходит вместе с данными: сервер не даст тому же ключу положить
 * деньги или начислить баллы второй раз — ни двойным нажатием, ни повтором
 * после обрыва связи.
 */
export function newRequestKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // Запасной вариант для старых браузеров: тот же формат UUID v4.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/**
 * Имя с отделом в скобках: «(Дизайн) Александр». Тёзок в разных отделах
 * так видно сразу. Без отдела — просто имя.
 */
export function withDepartment(name, department) {
  const dept = typeof department === 'string' ? department : department?.name
  return dept ? `(${dept}) ${name}` : name
}
