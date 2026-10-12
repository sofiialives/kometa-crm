import { useEffect, useMemo, useState } from 'react'
import { Button, Input } from '../../../shared/ui'
import { dollars, scaleErrors } from '../../../utils/motivation'

const SAMPLE_BANK_CENTS = 20000

/**
 * Редактор шкалы премии: порог в баллах и доля банка для каждого уровня.
 * Уровни можно добавлять и убирать — так в задании.
 *
 * Доля последнего уровня всегда 100%: он и есть весь банк. Поле не
 * редактируется, чтобы шкалу нельзя было сохранить в виде, который сервер
 * всё равно отклонит. Убрать можно любой уровень, и последний тоже — тогда
 * последним становится предыдущий и забирает весь банк уже он.
 *
 * Рядом — сколько уровень стоит при банке 200 $, как в таблице из задания:
 * по одним процентам трудно почувствовать, нравится ли шкала.
 */
export function ScaleEditor({ levels, onSave, saveLabel = 'Сохранить шкалу' }) {
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState([])
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  // Сбрасываем ввод, только если с сервера пришла другая шкала. Сохранение
  // в соседнем блоке перезапрашивает все настройки, и по ссылке массив
  // всегда новый — набранное, но не сохранённое пропадало бы.
  const serverKey = JSON.stringify(levels.map((l) => [l.threshold, l.percent]))
  useEffect(() => {
    setRows(levels.map((l) => ({ threshold: String(l.threshold), percent: String(l.percent) })))
    setErrors([])
  }, [serverKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (i, key, value) => {
    setSaved(false)
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: value.replace(/\D/g, '').slice(0, 3) } : r)))
  }

  const add = () => {
    setSaved(false)
    setRows((rs) => {
      // Новый уровень встаёт перед последним: последний всегда весь банк.
      const last = rs[rs.length - 1]
      const prev = rs[rs.length - 2]
      const threshold = String(Math.max(1, Math.round(((Number(prev?.threshold) || 0) + Number(last.threshold)) / 2)))
      const percent = String(Math.max(1, Math.round(((Number(prev?.percent) || 0) + 100) / 2)))
      return [...rs.slice(0, -1), { threshold, percent }, last]
    })
  }

  const remove = (i) => { setSaved(false); setRows((rs) => rs.filter((_, j) => j !== i)) }

  const normalized = useMemo(() => rows.map((r, i) => ({
    threshold: Number(r.threshold),
    percent: i === rows.length - 1 ? 100 : Number(r.percent),
  })), [rows])

  async function save() {
    const local = scaleErrors(normalized)
    if (local.length) { setErrors(local); setSaved(false); return }
    setBusy(true)
    const res = await onSave(normalized)
    setBusy(false)
    if (res?.ok) { setErrors([]); setSaved(true) } else setErrors([res?.error || 'Не удалось сохранить шкалу'])
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden grid-cols-[3rem_1fr_1fr_5rem_2.5rem] gap-3 px-1 text-xs text-ink-3 sm:grid">
        <span>Уровень</span><span>Баллов нужно</span><span>Доля банка, %</span><span className="text-right">При 200 $</span><span />
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((r, i) => {
          const isLast = i === rows.length - 1
          return (
            <li key={i} className="grid grid-cols-[3rem_1fr_1fr_2.5rem] items-center gap-3 sm:grid-cols-[3rem_1fr_1fr_5rem_2.5rem]">
              <span className="text-sm font-semibold">{i + 1}</span>
              <Input size="sm" inputMode="numeric" value={r.threshold} onChange={(e) => update(i, 'threshold', e.target.value)} aria-label={`Порог уровня ${i + 1}`} />
              <Input
                size="sm"
                inputMode="numeric"
                value={isLast ? '100' : r.percent}
                disabled={isLast}
                title={isLast ? 'Последний уровень — весь банк' : undefined}
                onChange={(e) => update(i, 'percent', e.target.value)}
                aria-label={`Доля уровня ${i + 1}`}
              />
              <span className="hidden text-right text-sm tabular-nums text-ink-2 sm:block">
                {dollars((SAMPLE_BANK_CENTS * (isLast ? 100 : Number(r.percent) || 0)) / 100)}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={rows.length <= 1}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-danger/10 hover:text-danger disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                aria-label={`Убрать уровень ${i + 1}`}
                title={rows.length <= 1 ? 'В шкале должен остаться хотя бы один уровень' : 'Убрать уровень'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </li>
          )
        })}
      </ul>

      {errors.map((e) => <p key={e} className="text-sm text-danger">{e}</p>)}

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" onClick={add} disabled={rows.length >= 10}>Добавить уровень</Button>
        <Button size="sm" loading={busy} onClick={save}>{saveLabel}</Button>
        {saved && <span className="text-sm text-ok">Сохранено</span>}
      </div>
      <p className="text-xs text-ink-3 leading-relaxed">
        Пороги и доли должны расти от уровня к уровню. Последний уровень всегда забирает весь банк — его доля 100%,
        поэтому поле не меняется; убрать можно любой уровень, и тогда весь банк забирает новый последний. Новый
        уровень встаёт перед последним. Изменения действуют сразу на текущий месяц, начисленные баллы не
        пересчитываются.
      </p>
    </div>
  )
}
