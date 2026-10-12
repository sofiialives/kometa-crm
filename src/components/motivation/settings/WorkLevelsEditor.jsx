import { useEffect, useState } from 'react'
import { Button, Input, Textarea } from '../../../shared/ui'
import { workLevelErrors } from '../../../utils/motivation'

/**
 * Уровни работы: названия, границы и подсказки. Первый уровень всегда
 * начинается с нуля — иначе на малых баллах человек остался бы без уровня.
 */
export function WorkLevelsEditor({ levels, onSave }) {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  // Как и в шкале: сбрасываем ввод, только если пришло другое содержимое.
  // У каждой строки помним, каким по счёту уровень был на сервере, — чтобы
  // подсказки профилей переехали вместе с ним.
  const serverKey = JSON.stringify(levels)
  useEffect(() => {
    setRows(levels.map((l) => ({ title: l.title, minPoints: String(l.minPoints), hint: l.hint || '', from: l.position })))
    setError(null)
  }, [serverKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (i, key, value) => {
    setSaved(false)
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: value } : r)))
  }

  const add = () => {
    setSaved(false)
    const last = rows[rows.length - 1]
    const min = Math.min(100, (Number(last?.minPoints) || 0) + 10)
    setRows((rs) => [...rs, { title: '', minPoints: String(min), hint: '', from: null }])
  }

  async function save() {
    const payload = rows.map((r, i) => ({ title: r.title, minPoints: i === 0 ? 0 : Number(r.minPoints), hint: r.hint, from: r.from ?? null }))
    const local = workLevelErrors(payload)
    if (local.length) { setError(local[0]); setSaved(false); return }
    setBusy(true)
    const res = await onSave(payload)
    setBusy(false)
    if (res?.ok) { setError(null); setSaved(true) } else setError(res?.error || 'Не удалось сохранить уровни')
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-lg border border-line p-3">
            <div className="grid grid-cols-[1fr_7rem_2.5rem] items-end gap-3">
              <Input size="sm" label={`Уровень ${i + 1}`} value={r.title} onChange={(e) => update(i, 'title', e.target.value)} maxLength={60} />
              <Input
                size="sm"
                label="С баллов"
                inputMode="numeric"
                value={i === 0 ? '0' : r.minPoints}
                disabled={i === 0}
                onChange={(e) => update(i, 'minPoints', e.target.value.replace(/\D/g, '').slice(0, 3))}
              />
              <button
                type="button"
                onClick={() => { setSaved(false); setRows((rs) => rs.filter((_, j) => j !== i)) }}
                disabled={rows.length <= 1 || i === 0}
                className="grid h-9 w-9 place-items-center rounded-lg text-ink-3 hover:bg-danger/10 hover:text-danger disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                aria-label={`Убрать уровень ${i + 1}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <Textarea rows={2} placeholder="Подсказка сотруднику на этом уровне" value={r.hint} onChange={(e) => update(i, 'hint', e.target.value)} maxLength={500} />
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" onClick={add} disabled={rows.length >= 10}>Добавить уровень</Button>
        <Button size="sm" loading={busy} onClick={save}>Сохранить уровни</Button>
        {saved && <span className="text-sm text-ok">Сохранено</span>}
      </div>
    </div>
  )
}
