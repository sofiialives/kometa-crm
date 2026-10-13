import { useState } from 'react'
import { useMotivationStore } from '../../core/store/motivationStore'
import { cx } from '../../shared/lib/cx'
import { dateTime } from '../../utils/motivation'

const FORMATS = [
  { id: 'xlsx', label: 'Excel' },
  { id: 'pdf', label: 'PDF' },
  { id: 'docx', label: 'Word' },
  { id: 'csv', label: 'CSV' },
  { id: 'txt', label: 'TXT' },
]

/**
 * Итоги месяца для зарплаты: пять форматов одной таблицы и строка о том,
 * закрыт ли месяц. Закрытый выгружается из снимка закрытия, текущий —
 * с пометкой в файле, что цифры предварительные.
 */
export function ExportBar({ month, closedAt, isCurrent }) {
  const downloadExport = useMotivationStore((s) => s.downloadExport)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  async function download(format) {
    if (busy) return
    setBusy(format)
    setError(null)
    const res = await downloadExport(month, format)
    setBusy(null)
    if (!res.ok) setError(res.error || 'Не удалось выгрузить')
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
      <p className={cx(closedAt ? 'text-ok' : 'text-ink-3')}>
        {closedAt
          ? `Месяц закрыт ${dateTime(closedAt)}: итоги зафиксированы, изменения не принимаются`
          : isCurrent
            ? 'Месяц идёт. Закроется сам 1 числа в 00:10 по Москве — итоги зафиксируются'
            : 'Месяц ещё не закрыт'}
      </p>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Выгрузить итоги">
        <span className="text-ink-3">Выгрузить итоги:</span>
        {FORMATS.map((f) => (
          <button
            key={f.id}
            type="button"
            disabled={Boolean(busy)}
            onClick={() => download(f.id)}
            className="rounded-md border border-line-2 px-2 py-0.5 font-semibold text-ink-2 hover:text-ink hover:border-ink-3 cursor-pointer disabled:opacity-50"
          >
            {busy === f.id ? '…' : f.label}
          </button>
        ))}
      </div>
      {error && <p className="w-full text-danger">{error}</p>}
    </div>
  )
}
