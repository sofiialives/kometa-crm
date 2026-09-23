import { useEffect, useState } from 'react'
import { api } from '../../core/api/client'
import { Badge, Button, Card, ConfirmModal } from '../../shared/ui'

/**
 * Подключение телеграма для напоминаний о звонках.
 *
 * Связать телеграм-аккаунт с сотрудником автоматически неоткуда: у CRM и
 * у телеграма нет общего признака. Поэтому CRM выдаёт одноразовый код и
 * ссылку на бота — человек уже вошёл сюда под собой, значит код
 * принадлежит именно ему, и подставить чужой аккаунт нельзя.
 *
 * Дальше он жмёт Start, бот находит строку по коду и запоминает чат.
 * Ничего вводить руками не нужно.
 */
export function TelegramCard() {
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmOff, setConfirmOff] = useState(false)

  async function load() {
    try {
      setStatus(await api.get('/telegram'))
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => { load() }, [])

  // Возвращаемся на вкладку после того, как нажали Start у бота — самое
  // время перечитать статус, чтобы человек увидел «подключено» сам, без
  // перезагрузки страницы.
  useEffect(() => {
    const onFocus = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [])

  async function connect() {
    setBusy(true)
    setError(null)
    try {
      const { deepLink } = await api.post('/telegram/code')
      window.open(deepLink, '_blank', 'noopener')
    } catch (e) {
      setError(e.message)
    }
    setBusy(false)
  }

  async function disconnect() {
    setBusy(true)
    setConfirmOff(false)
    try {
      await api.del('/telegram')
      await load()
    } catch (e) {
      setError(e.message)
    }
    setBusy(false)
  }

  const linked = status?.linked

  // Пока на сервере не задано имя бота, карточки нет вовсе. Так фронт
  // можно выкатить заранее: у команды ничего лишнего не появится, а
  // включится всё само, стоит прописать TELEGRAM_BOT_USERNAME — без
  // второго деплоя.
  if (!status || !status.botUsername) return null

  return (
    <Card pad="md" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">Напоминания в телеграм</p>
            {linked && <Badge tone="ok">Подключено</Badge>}
          </div>
          <p className="text-sm text-ink-3 max-w-md leading-relaxed">
            Бот напомнит о звонке за пятнадцать минут — вам и всем, кого позвали.
          </p>
        </div>
      </div>

      {linked ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-ink-2">
            {status.username ? `Аккаунт @${status.username}` : 'Аккаунт подключён'}
          </p>
          <Button variant="ghost" className="!text-danger" onClick={() => setConfirmOff(true)} disabled={busy}>
            Отключить
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 items-start">
          <Button onClick={connect} loading={busy}>Подключить телеграм</Button>
          <p className="caption">Откроется бот — нажмите в нём «Start», больше ничего вводить не нужно.</p>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <ConfirmModal
        open={confirmOff}
        onClose={() => setConfirmOff(false)}
        onConfirm={disconnect}
        danger
        title="Отключить телеграм?"
        confirmText="Отключить"
        text="Напоминания о звонках приходить перестанут. Подключить обратно можно в любой момент."
      />
    </Card>
  )
}
