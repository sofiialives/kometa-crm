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
  // Ссылка на бота после нажатия «Подключить». Держим её на экране:
  // новое окно после ответа сервера браузер может и не открыть (Safari,
  // телефоны, долгий ответ), а обычную ссылку по клику не блокирует никто.
  const [deepLink, setDeepLink] = useState(null)
  // Сколько минут живёт код, говорит сервер.
  const [ttlMin, setTtlMin] = useState(15)

  // Код в ссылке одноразовый и живёт недолго: дольше держать его на экране
  // незачем, после привязки и отключения тоже.
  useEffect(() => {
    if (!deepLink) return undefined
    const timer = setTimeout(() => setDeepLink(null), ttlMin * 60 * 1000)
    return () => clearTimeout(timer)
  }, [deepLink, ttlMin])

  async function load() {
    try {
      const next = await api.get('/telegram')
      setStatus(next)
      if (next?.linked) setDeepLink(null)
      setError(null)
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
      const { deepLink: link, expiresInMin } = await api.post('/telegram/code')
      if (expiresInMin > 0) setTtlMin(expiresInMin)
      setDeepLink(link)
      window.open(link, '_blank', 'noopener')
    } catch (e) {
      setError(e.message)
    }
    setBusy(false)
  }

  async function disconnect() {
    setBusy(true)
    setConfirmOff(false)
    setDeepLink(null)
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
  // Если же статус не загрузился вовсе, молча прятать карточку нельзя:
  // человек решит, что подключать нечего.
  if (!status && error) {
    return (
      <Card pad="md" className="flex flex-col gap-3 items-start">
        <p className="font-medium">Напоминания в телеграм</p>
        <p className="text-sm text-danger">Не получилось загрузить настройки телеграма. {error}</p>
        <Button variant="secondary" onClick={load}>Попробовать ещё раз</Button>
      </Card>
    )
  }
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
        deepLink ? (
          <div className="flex flex-col gap-2 items-start">
            <div className="flex flex-wrap items-center gap-2">
              <Button as="a" href={deepLink} target="_blank" rel="noopener noreferrer">Открыть бота</Button>
              <Button variant="ghost" onClick={connect} loading={busy}>Новая ссылка</Button>
            </div>
            <p className="caption">
              Если бот не открылся сам, нажмите «Открыть бота» и в нём «Start». Ссылка работает {ttlMin} минут.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-start">
            <Button onClick={connect} loading={busy}>Подключить телеграм</Button>
            <p className="caption">Откроется бот — нажмите в нём «Start», больше ничего вводить не нужно.</p>
          </div>
        )
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
