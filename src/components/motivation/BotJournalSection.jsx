import { useEffect, useRef, useState } from 'react'
import { Button, Card, EmptyState, Select, Spinner } from '../../shared/ui'
import { useAuthStore } from '../../core/store/authStore'
import { cx } from '../../shared/lib/cx'
import { useMotivationStore } from '../../core/store/motivationStore'
import { MonthSelect } from './MonthSelect'
import { dayHeading, describe, duration, hm, times } from '../../utils/botJournal'

/**
 * «Журнал бота» — что было с человеком в телеграме за месяц: отлучки и
 * сколько его не было, опоздания, форс-мажоры, чек-ины, «задерживаюсь»,
 * «не успеваю», конец дня. Сверху сводка, ниже — по дням.
 *
 * Владелец видит и слова человека, и переписку за день (раскрывается по
 * клику). Руководитель — свой отдел и только факты: тексты сервер ему не
 * присылает.
 */
export function BotJournalSection({ person, onPersonChange, month, onMonthChange }) {
  const { fetchBotJournalPeople, fetchBotJournal } = useMotivationStore()
  const meId = useAuthStore((s) => s.user?.id)
  const [people, setPeople] = useState(null)
  const [journal, setJournal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const request = useRef(0)

  useEffect(() => {
    fetchBotJournalPeople().then((res) => {
      if (res.ok) setPeople(res.data)
      else setError(res.error)
    })
  }, [fetchBotJournalPeople])

  // Никого не выбрали — первый по алфавиту; руководителю — не он сам.
  const list = people ?? []
  const selected = person && list.some((p) => p.id === person) ? person : (list.find((p) => p.id !== meId) ?? list[0])?.id

  useEffect(() => {
    if (!selected) return
    const n = ++request.current
    setLoading(true)
    setError(null)
    // Другой человек — прежний журнал не показываем ни секунды.
    setJournal((j) => (j && j.employee.id !== selected ? null : j))
    fetchBotJournal(selected, month || undefined).then((res) => {
      // Быстро переключили человека — старый ответ не затирает новый.
      if (n !== request.current) return
      setLoading(false)
      if (res.ok) setJournal(res.data)
      else { setJournal(null); setError(res.error) }
    })
  }, [fetchBotJournal, selected, month])

  if (people === null && !error) return <div className="grid place-items-center py-14"><Spinner /></div>
  if (people && !people.length) return <Card><EmptyState label="Пусто" text="Здесь пока некого показать: нет сотрудников с банком." /></Card>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          className="w-72"
          size="sm"
          aria-label="Сотрудник"
          options={list.map((p) => ({ value: p.id, label: p.department ? `${p.name} · ${p.department.name}` : p.name }))}
          value={selected || ''}
          onChange={(e) => onPersonChange(e.target.value)}
        />
        {journal && (
          <MonthSelect months={journal.months} current={journal.currentMonth} value={journal.month} onChange={onMonthChange} className="w-60" />
        )}
        {loading && <Spinner size={16} />}
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-danger">{error}</p>
          {/* Месяц из старой ссылки мог уйти за пределы года — вернуть текущий. */}
          {month && <Button size="sm" variant="ghost" onClick={() => onMonthChange('')}>Открыть текущий месяц</Button>}
        </div>
      )}
      {journal && !journal.telegram && (
        <p className="text-sm text-warn">Телеграм не подключён — бот этому человеку не пишет и чек-ин его не спрашивает.</p>
      )}
      {journal && <Summary summary={journal.summary} />}
      {journal && journal.days.length === 0 && (
        <Card><EmptyState label="Пусто" text="За этот месяц в боте ничего не было. Отлучки, чек-ины и сообщения появятся здесь, как только человек начнёт пользоваться ботом." /></Card>
      )}
      {journal?.messagesTruncated && <p className="text-xs text-ink-3">Сообщений за месяц очень много — переписка показана за последние дни.</p>}
      {journal?.days.map((d) => <Day key={`${journal.employee.id}-${d.day}`} day={d} full={journal.full} />)}
    </div>
  )
}

function Stat({ label, value, note, tone }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-line px-3 py-2.5">
      <span className="text-xs text-ink-3">{label}</span>
      <span className={cx('text-lg font-semibold tabular-nums', tone === 'warn' && 'text-warn', tone === 'danger' && 'text-danger')}>{value}</span>
      {note && <span className="text-xs text-ink-3">{note}</span>}
    </div>
  )
}

function Summary({ summary: s }) {
  const c = s.checkins
  return (
    <Card className="flex flex-col gap-3">
      <p className="caption">Итоги месяца</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Отлучек" value={s.breaks} note={s.breaks ? `всего ${duration(s.awayMinutes)}` : null} />
        <Stat label="Опозданий из отлучки" value={s.lateBreaks} note={s.lateBreaks ? `на ${duration(s.lateMinutes)}` : null} tone={s.lateBreaks ? 'warn' : null} />
        <Stat label="Продлений" value={s.extensions} />
        <Stat label="Не отметился после отлучки" value={s.unmarked} tone={s.unmarked ? 'warn' : null} />
        <Stat label="Форс-мажоров" value={s.forceMajeure} />
        <Stat label="Чек-ины: ответил" value={`${c.answered} из ${c.asked}`} note={c.skipped ? `не спрашивал ${c.skipped} ${times(c.skipped)}` : null} />
        <Stat label="Чек-ины: промолчал" value={c.penalized} tone={c.penalized ? 'danger' : null} />
        <Stat label="«Задерживаюсь», «не успеваю»" value={s.lateReports} tone={s.lateReports ? 'warn' : null} />
        <Stat label="Закрыл задач" value={s.tasksDone ?? 0} note={s.tasksDoneLate ? `позже срока ${s.tasksDoneLate}` : null} />
        <Stat label="Просрочено задач" value={s.tasksOverdue ?? 0} tone={s.tasksOverdue ? 'danger' : null} />
        <Stat label="Продлевал сроки" value={s.tasksExtended ?? 0} tone={s.tasksExtended ? 'warn' : null} />
        <Stat label="Не начал вовремя" value={s.tasksNotStarted ?? 0} tone={s.tasksNotStarted ? 'warn' : null} />
        <Stat label="«На сегодня всё»" value={s.dayEnds} />
      </div>
    </Card>
  )
}

const TONE = { ok: 'bg-ok', warn: 'bg-warn', danger: 'bg-danger', muted: 'bg-line-2' }

function Day({ day, full }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{dayHeading(day.day)}</p>
        {full && day.messages.length > 0 && (
          <button type="button" className="text-sm text-accent hover:underline cursor-pointer" onClick={() => setOpen((v) => !v)}>
            {open ? 'Скрыть переписку' : `Переписка · ${day.messages.length}`}
          </button>
        )}
      </div>
      {day.items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {day.items.map((item) => {
            const line = describe(item)
            return (
              <li key={`${item.kind}-${item.id}`} className="flex gap-3">
                <span className="w-12 shrink-0 pt-0.5 text-xs tabular-nums text-ink-3">{hm(item.at)}</span>
                <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', TONE[line.tone])} />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm leading-snug">{line.title}</span>
                  {line.detail && <span className="text-xs text-ink-3 break-words">{line.detail}</span>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {day.items.length === 0 && !open && <p className="text-xs text-ink-3">Событий не было, только переписка.</p>}
      {open && <Chat messages={day.messages} />}
    </Card>
  )
}

/** Переписка за день: бот слева, человек справа, нажатые кнопки курсивом. */
function Chat({ messages }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-panel-2 p-3">
      {messages.map((m, i) => {
        const mine = m.direction !== 'out'
        return (
          <div key={i} className={cx('flex flex-col max-w-[85%]', mine ? 'self-end items-end' : 'self-start')}>
            <div className={cx(
              'whitespace-pre-line break-words rounded-xl px-3 py-1.5 text-sm',
              mine ? 'bg-accent-soft' : 'bg-panel border border-line',
              m.direction === 'button' && 'italic text-ink-2',
            )}
            >
              {m.direction === 'button' ? `нажата кнопка «${m.text}»` : m.text}
            </div>
            <span className="px-1 text-[11px] text-ink-3">{hm(m.at)}</span>
          </div>
        )
      })}
    </div>
  )
}
