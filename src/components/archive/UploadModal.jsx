import { useEffect, useRef, useState } from 'react'
import { Button, DatePicker, Modal } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { archiveDayKey, fileSize } from '../../utils/archive'

// Тот же потолок, что и на сервере. Здесь он нужен только чтобы сказать
// человеку заранее, а не после долгой загрузки; настоящую проверку делает
// бэкенд — на него и полагаемся.
const MAX_MB = 20

/**
 * Загрузка отчёта. Полей содержания нет специально: отчёт приносят
 * готовым PDF, так решил заказчик.
 *
 * Дата работы — единственное поле. Она необязательная и подставляется
 * сегодняшней, но её оставили потому, что архив наполняют старыми
 * отчётами: без неё все они получили бы дату загрузки, и фильтр по
 * периоду оказался бы бесполезен как раз тогда, когда нужнее всего.
 */
export function UploadModal({ open, onClose, onSubmit, service }) {
  const [file, setFile] = useState(null)
  const [workedAt, setWorkedAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setFile(null)
    setWorkedAt(archiveDayKey())
    setError(null)
    setDragging(false)
  }, [open])

  function take(picked) {
    if (!picked) return
    if (picked.type !== 'application/pdf') return setError('Принимаются только PDF')
    if (picked.size > MAX_MB * 1024 * 1024) return setError(`Файл больше ${MAX_MB} МБ`)
    setError(null)
    setFile(picked)
  }

  async function submit() {
    if (!file) return setError('Выберите файл отчёта')
    setBusy(true)
    setError(null)
    const res = await onSubmit({ file, workedAt })
    setBusy(false)
    if (!res.ok) return setError(res.error)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Отчёт по услуге"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button onClick={submit} loading={busy}>Загрузить</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {service && (
          <p className="text-sm text-ink-3 leading-relaxed">
            {service.title}
            {service.department?.name ? ` · ${service.department.name}` : ''}
          </p>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); take(e.dataTransfer.files?.[0]) }}
          onClick={() => inputRef.current?.click()}
          className={cx(
            'flex cursor-pointer flex-col items-center gap-2 rounded-card border border-dashed px-4 py-7 text-center transition-colors',
            dragging ? 'border-accent bg-accent-soft' : 'border-line-2 hover:border-accent hover:bg-panel-2',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => take(e.target.files?.[0])}
          />
          {file ? (
            <>
              <p className="max-w-full truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-ink-3">{fileSize(file.size)} · нажмите, чтобы выбрать другой</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Перетащите PDF сюда</p>
              <p className="text-xs text-ink-3">или нажмите и выберите файл. До {MAX_MB} МБ</p>
            </>
          )}
        </div>

        <DatePicker
          label="Когда была работа"
          value={workedAt}
          onChange={setWorkedAt}
          today={archiveDayKey()}
          max={archiveDayKey()}
          hint="По ней ищут за период. Для старого отчёта поставьте его дату"
        />

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
