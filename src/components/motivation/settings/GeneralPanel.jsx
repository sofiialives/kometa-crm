import { useEffect, useState } from 'react'
import { Button, Card, Checkbox, Input } from '../../../shared/ui'

/**
 * Общие параметры: лимит штрафа за просрочку на одну задачу, потолок
 * баллов за личные задачи в день и уведомления о пополнении банка и баллах.
 */
export function GeneralPanel({ general, onSave }) {
  const [form, setForm] = useState(general)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { setForm(general) }, [general])

  const num = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value.replace(/\D/g, '').slice(0, 3) }))

  async function save() {
    setBusy(true)
    const res = await onSave({
      overduePenaltyCap: Number(form.overduePenaltyCap || 0),
      personalTaskDailyCap: Number(form.personalTaskDailyCap || 0),
      notifyBank: Boolean(form.notifyBank),
      notifyPoints: Boolean(form.notifyPoints),
    })
    setBusy(false)
    setMessage(res.ok ? { ok: true, text: 'Сохранено' } : { ok: false, text: res.error })
  }

  return (
    <Card className="flex flex-col gap-4">
      <p className="caption">Общие параметры</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Лимит штрафа за просрочку одной задачи"
          inputMode="numeric"
          value={String(form.overduePenaltyCap ?? '')}
          onChange={num('overduePenaltyCap')}
          hint="Сколько баллов максимум снимается за одну задачу, сколько бы дней она ни висела"
        />
        <Input
          label="Потолок баллов за личные задачи в день"
          inputMode="numeric"
          value={String(form.personalTaskDailyCap ?? '')}
          onChange={num('personalTaskDailyCap')}
          hint="Личные задачи человек ставит себе сам — без потолка ими можно было бы набрать всю шкалу"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Checkbox label="Сообщать сотруднику о пополнении банка" checked={Boolean(form.notifyBank)} onChange={(e) => setForm((f) => ({ ...f, notifyBank: e.target.checked }))} />
        <Checkbox label="Сообщать сотруднику о начислении и списании баллов" checked={Boolean(form.notifyPoints)} onChange={(e) => setForm((f) => ({ ...f, notifyPoints: e.target.checked }))} />
        <p className="text-xs text-ink-3">Сообщения в телеграм будет отправлять агент. Пока новое подсвечивается во вкладке.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" loading={busy} onClick={save}>Сохранить</Button>
        {message && <span className={message.ok ? 'text-sm text-ok' : 'text-sm text-danger'}>{message.text}</span>}
      </div>
    </Card>
  )
}
