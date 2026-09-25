import { useEffect, useMemo, useState } from 'react'
import { Avatar, AvatarStack, Button, DatePicker, Input, Modal, Textarea, TimePicker } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { buildDeadlineMsk, defaultMskTimeValue, isPastMsk, mskDateValueIn, splitDeadlineMsk } from '../../utils/tasks'
import { maxPlanKey, PLAN_DAYS_AHEAD, shortName, todayKey } from '../../utils/calls'

/**
 * Одно окно и на создание, и на правку: поля те же, и держать две почти
 * одинаковые формы значило бы чинить потом каждую мелочь дважды.
 * call === null — создаём, иначе открываем существующий.
 *
 * Менять звонок может только организатор. Участник открывает ту же
 * карточку, но в режиме чтения: поля заблокированы, кнопок нет. Так он
 * видит, во сколько созвон и о чём, но не может сдвинуть его под собой.
 */
export function CallModal({ open, call, presetDay, canManage = true, author, directory = [], onClose, onSubmit, onDelete }) {
  const editing = Boolean(call)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(mskDateValueIn)
  const [time, setTime] = useState(defaultMskTimeValue)
  const [note, setNote] = useState('')
  const [participantIds, setParticipantIds] = useState([])
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Пересобираем поля на каждое открытие: иначе окно, открытое вчера
  // вечером и не перезагруженное, подставит вчерашний день, а при правке
  // покажет данные предыдущей карточки.
  useEffect(() => {
    if (!open) return
    setError(null)
    setPicking(false)
    if (call) {
      const { date: d, time: t } = splitDeadlineMsk(call.scheduledAt)
      setTitle(call.title)
      setDate(d)
      setTime(t)
      setNote(call.note || '')
      setParticipantIds((call.participants || []).map((p) => p.id))
    } else {
      setTitle('')
      setDate(presetDay || mskDateValueIn())
      setTime(defaultMskTimeValue())
      setNote('')
      setParticipantIds([])
    }
  }, [open, call, presetDay])

  const past = isPastMsk(date, time)
  const hint = past ? 'Это время уже прошло — звонок сразу получит пометку «прошёл» и уйдёт ночью' : ''

  const organizerId = call?.owner?.id || author?.id
  const who = call?.owner?.name?.trim() || author?.name || 'Вы'
  const whereFrom = call?.department?.name || author?.department || null

  // Себя в список не кладём: организатор и так в звонке.
  const people = useMemo(
    () => directory.filter((u) => u.id !== organizerId),
    [directory, organizerId],
  )

  const byDepartment = useMemo(() => {
    const map = new Map()
    for (const u of people) {
      const id = u.department?.id || '__none__'
      const name = u.department?.name || 'Без отдела'
      if (!map.has(id)) map.set(id, { id, name, people: [] })
      map.get(id).people.push(u)
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [people])

  // При правке участники приходят с сервера, а справочник может ещё не
  // догрузиться — берём и оттуда, чтобы аватары не мигали пустотой.
  const chosen = useMemo(() => {
    const known = new Map([...(call?.participants || []), ...people].map((u) => [u.id, u]))
    return participantIds.map((id) => known.get(id)).filter(Boolean)
  }, [participantIds, people, call])

  function toggle(id) {
    setParticipantIds((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Проверяем на месте, а не полагаемся на required у поля: общие
    // Input и Textarea берут этот флаг только ради звёздочки в подписи и
    // в сам контрол его не передают. Без этой проверки человек дошёл бы
    // до отказа сервера вместо понятной подсказки под кнопкой.
    if (!title.trim()) {
      setError('Напишите, с кем звонок')
      return
    }
    if (!note.trim()) {
      setError('Добавьте заметку — по ней потом будет понятно, зачем звонили')
      return
    }
    // Календарь дальние дни и так не даёт выбрать, но карточку могли
    // открыть старую — с датой, поставленной до появления ограничения.
    if (date > maxPlanKey()) {
      setError(`Звонки ставят не дальше чем на ${PLAN_DAYS_AHEAD} дней вперёд`)
      return
    }
    if (date < todayKey()) {
      setError('Этот день уже прошёл — выберите другой')
      return
    }

    let scheduledAt
    try {
      scheduledAt = buildDeadlineMsk(date, time)
    } catch {
      setError('Укажите корректные день и время')
      return
    }

    setLoading(true)
    const res = await onSubmit({ title, note, scheduledAt, participantIds })
    setLoading(false)
    if (res.ok) onClose()
    else setError(res.error)
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Звонок' : 'Новый звонок'} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 rounded-[--radius-field] bg-panel-2 px-3 py-2.5">
          <Avatar
            name={who}
            src={call?.owner?.avatarUrl || author?.avatarUrl}
            color={call?.owner?.avatarColor || author?.avatarColor}
            size={26}
          />
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-medium truncate">{who}</p>
            <p className="caption truncate">
              {editing ? 'организатор' : 'звонок запишется на вас'}
              {whereFrom && ` · ${whereFrom}`}
            </p>
          </div>
        </div>

        {!canManage && (
          <p className="text-xs text-ink-3 leading-relaxed -mt-1">
            Вас позвали на этот звонок. Перенести или отменить его может только организатор.
          </p>
        )}

        <Input
          label="С кем звонок"
          placeholder="Например: Ozon, обсудить бюджет"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canManage}
          required
          autoFocus
        />

        {/* Дню нужно больше места: «ср, 23 сентября» в половине ширины
            обрезалось многоточием, а времени хватает и меньшего поля. */}
        <div className="grid grid-cols-5 gap-3">
          <DatePicker
            className="col-span-3"
            label="День"
            value={date}
            onChange={setDate}
            today={todayKey()}
            min={todayKey()}
            max={maxPlanKey()}
            disabled={!canManage}
            required
          />
          <TimePicker
            className="col-span-2"
            label="Время (МСК)"
            value={time}
            onChange={setTime}
            disabled={!canManage}
            required
          />
        </div>

        {hint && <p className="text-xs text-warn leading-snug -mt-1">{hint}</p>}

        <Textarea
          label="Заметка"
          placeholder="О чём звонок, что подготовить"
          hint="Нужна, чтобы через день было понятно, зачем звонили"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={!canManage}
          required
          rows={3}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="caption select-none">Участники</span>
            {canManage && people.length > 0 && (
              <button
                type="button"
                onClick={() => setPicking((p) => !p)}
                className="caption !text-accent hover:underline cursor-pointer"
              >
                {picking ? 'Свернуть' : 'Позвать коллег'}
              </button>
            )}
          </div>

          {chosen.length === 0 ? (
            <p className="text-xs text-ink-3">Пока только вы</p>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <AvatarStack
                size={24}
                users={chosen.map((u) => ({ id: u.id, name: u.name, src: u.avatarUrl, color: u.avatarColor }))}
              />
              <span className="caption truncate">{chosen.map((u) => shortName(u.name)).join(', ')}</span>
            </div>
          )}

          {picking && (
            <div className="panel rounded-[--radius-field] max-h-48 overflow-y-auto p-1.5 flex flex-col">
              {byDepartment.map((group) => (
                <div key={group.id} className="flex flex-col">
                  <p className="caption px-2 pt-2 pb-1">{group.name}</p>
                  {group.people.map((u) => {
                    const on = participantIds.includes(u.id)
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggle(u.id)}
                        className={cx(
                          'flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer',
                          on ? 'bg-accent-soft' : 'hover:bg-panel-2',
                        )}
                      >
                        <Avatar name={u.name} src={u.avatarUrl} color={u.avatarColor} size={22} />
                        <span className={cx('text-sm truncate flex-1', on ? 'text-ink' : 'text-ink-2')}>
                          {u.name?.trim() || 'Без имени'}
                        </span>
                        {on && (
                          <svg className="shrink-0 text-accent" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {canManage && (
          <div className="flex items-center gap-3 pt-1">
            {editing && onDelete && (
              <Button type="button" variant="ghost" className="mr-auto !text-danger" onClick={() => onDelete(call)}>
                Удалить
              </Button>
            )}
            <Button type="button" variant="ghost" className={editing ? '' : 'ml-auto'} onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={loading}>{editing ? 'Сохранить' : 'Создать'}</Button>
          </div>
        )}
      </form>
    </Modal>
  )
}
