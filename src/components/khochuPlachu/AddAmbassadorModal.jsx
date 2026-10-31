import { useEffect, useRef, useState } from 'react'
import { Button, DatePicker, Field, Input, Modal, TimePicker } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { todayKey } from '../../utils/calls'
import { MSK_OFFSET_MS } from '../../utils/tasks'

function nowMskTime() {
  const d = new Date(Date.now() + MSK_OFFSET_MS)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

const EMPTY_LINK = { label: '', url: '' }

export function AddAmbassadorModal({ open, onClose, onSubmit, themes }) {
  const [theme, setTheme] = useState('')
  const [conditions, setConditions] = useState('')
  const [managerComment, setManagerComment] = useState('')
  const [callDate, setCallDate] = useState('')
  const [callTime, setCallTime] = useState('')
  const [telegramGroupLink, setTelegramGroupLink] = useState('')
  const [contactUsername, setContactUsername] = useState('')
  const [links, setLinks] = useState([{ ...EMPTY_LINK }])
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  function reset() {
    setTheme(''); setConditions(''); setManagerComment(''); setCallDate(''); setCallTime('')
    setTelegramGroupLink(''); setContactUsername(''); setLinks([{ ...EMPTY_LINK }]); setFiles([]); setErrors({})
  }

  function close() {
    reset()
    onClose()
  }

  useEffect(() => {
    if (!open) return
    setCallDate(todayKey())
    setCallTime(nowMskTime())
  }, [open])

  function addFiles(list) {
    setFiles((prev) => [...prev, ...Array.from(list || [])])
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function setLink(index, patch) {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)))
  }

  function addLink() {
    setLinks((prev) => [...prev, { ...EMPTY_LINK }])
  }

  function removeLink(index) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  function validate() {
    const next = {}
    if (!theme.trim()) next.theme = 'Укажите тематику'
    if (!conditions.trim()) next.conditions = 'Укажите условия'
    if (!telegramGroupLink.trim()) next.telegramGroupLink = 'Укажите ссылку на общий чат'
    if (!contactUsername.trim()) next.contactUsername = 'Укажите контакт'
    else if (!contactUsername.trim().startsWith('@')) next.contactUsername = 'Юзернейм должен начинаться с @'
    const cleanLinks = links.filter((l) => l.label.trim() || l.url.trim())
    if (cleanLinks.length === 0) next.links = 'Добавьте хотя бы одну ссылку'
    else if (cleanLinks.some((l) => !l.label.trim() || !l.url.trim())) next.links = 'Заполните название и ссылку у каждой соцсети'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit() {
    if (!validate()) return
    setBusy(true)
    const callAt = callDate && callTime ? `${callDate}T${callTime}:00` : ''
    const payload = {
      theme: theme.trim(),
      conditions: conditions.trim(),
      managerComment: managerComment.trim(),
      callAt,
      telegramGroupLink: telegramGroupLink.trim(),
      contactUsername: contactUsername.trim(),
      links: links.filter((l) => l.label.trim() && l.url.trim()).map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
    }
    const res = await onSubmit(payload, files)
    setBusy(false)
    if (res?.ok) close()
    else window.alert(res?.error || 'Не удалось добавить амбассадора')
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Добавить амбассадора"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close}>Отмена</Button>
          <Button loading={busy} onClick={submit}>Добавить</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Скриншоты переписки" error={errors.files}>
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative flex items-center gap-2 rounded-lg border border-line-2 bg-panel px-3 py-2 text-sm">
                <span className="max-w-[160px] truncate">{f.name}</span>
                <button type="button" onClick={() => removeFile(i)} className="text-ink-3 hover:text-danger cursor-pointer" aria-label="Убрать файл">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>Добавить скрин</Button>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </div>
        </Field>

        <Field label="Ссылки на соцсети и ресурсы" required error={errors.links}>
          <div className="flex flex-col gap-2">
            {links.map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Название (Instagram, TikTok…)" value={l.label} onChange={(e) => setLink(i, { label: e.target.value })} className="w-40" />
                <Input placeholder="Ссылка" inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck="false" value={l.url} onChange={(e) => setLink(i, { url: e.target.value })} className="flex-1" />
                {links.length > 1 && (
                  <button type="button" onClick={() => removeLink(i)} className="grid place-items-center w-9 h-9 rounded-lg text-ink-3 hover:text-danger hover:bg-danger/10 cursor-pointer" aria-label="Удалить ссылку">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" className="self-start" onClick={addLink}>+ Добавить ссылку</Button>
          </div>
        </Field>

        <Input label="Тематика" required list="khochu-plachu-themes" value={theme} onChange={(e) => setTheme(e.target.value)} error={errors.theme} />
        <datalist id="khochu-plachu-themes">
          {themes.map((t) => <option key={t} value={t} />)}
        </datalist>

        <div>
          <label className="caption select-none">Условия <span className="text-accent ml-1">*</span></label>
          <textarea
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            rows={3}
            placeholder="Например: личные рекомендации; 5 постов в месяц"
            className={cx(
              'mt-1.5 w-full bg-panel border text-ink placeholder:text-ink-3 rounded-[--radius-field] outline-none transition-colors duration-150',
              'focus:border-accent focus:ring-2 focus:ring-accent/25 h-auto py-3 px-4 text-sm resize-y leading-relaxed',
              errors.conditions ? 'border-danger' : 'border-line-2',
            )}
          />
          {errors.conditions && <p className="text-xs text-danger leading-snug mt-1">{errors.conditions}</p>}
        </div>

        <div>
          <label className="caption select-none">Комментарий от менеджера</label>
          <textarea
            value={managerComment}
            onChange={(e) => setManagerComment(e.target.value)}
            rows={2}
            className="mt-1.5 w-full bg-panel border border-line-2 text-ink placeholder:text-ink-3 rounded-[--radius-field] outline-none transition-colors duration-150 focus:border-accent focus:ring-2 focus:ring-accent/25 h-auto py-3 px-4 text-sm resize-y leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DatePicker label="Удобная дата звонка" value={callDate} onChange={setCallDate} today={todayKey()} />
          <TimePicker label="Удобное время звонка" value={callTime} onChange={setCallTime} />
        </div>

        <Input label="Ссылка на общий чат Telegram" required inputMode="url" autoCapitalize="off" autoCorrect="off" spellCheck="false" value={telegramGroupLink} onChange={(e) => setTelegramGroupLink(e.target.value)} error={errors.telegramGroupLink} />
        <Input label="Контакт (username)" required placeholder="@username" value={contactUsername} onChange={(e) => setContactUsername(e.target.value)} error={errors.contactUsername} />
      </div>
    </Modal>
  )
}
