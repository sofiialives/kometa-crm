/** Русское склонение по числу: plural(1, 'задача', 'задачи', 'задач') → 'задача'. */
export function plural(n, one, few, many) {
  // Дробное число: «2,5 балла», «0,5 балла».
  if (!Number.isInteger(n) && Number.isFinite(n)) return few
  const mod100 = Math.abs(n) % 100
  if (mod100 >= 11 && mod100 <= 14) return many
  const mod10 = mod100 % 10
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

/** Число по-русски: дробная часть через запятую, не больше двух знаков. */
export const numRu = (n) => (Number.isInteger(n) ? String(n) : Number(n).toLocaleString('ru-RU', { maximumFractionDigits: 2 }))

export function withPlural(n, one, few, many) {
  return `${numRu(n)} ${plural(n, one, few, many)}`
}
