import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Avatar, Button, Card, Checkbox, EmptyState, Input, Modal, Spinner } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { useMotivationStore } from '../../core/store/motivationStore'
import { dateTime, dayMonth, pointsTone, pointsWord, signedPoints } from '../../utils/motivation'
import { plural } from '../../shared/lib/plural'
import { HistoryView } from './HistoryView'
import { useAutoRefresh } from '../../shared/lib/useAutoRefresh'

/**
 * «История баллов» владельца: все начисления с фильтрами и рядом «Ждут
 * решения» — заявки по правилам, которые владелец настроил «мне на
 * решение». Они же стоят блоком над историей: решённая заявка уходит из
 * блока в историю.
 *
 * Подсказанные баллы можно поменять прямо в строке. У личных задач рядом
 * — оценка сложности по названию и описанию и сколько человек уже получил
 * за личные задачи в этот день: десяток задач по одному слову видно сразу.
 */

const RULE_LABEL = {
  task_on_time: 'Задача из Иерархии закрыта в срок',
  personal_task_on_time: 'Личная задача закрыта в срок',
  task_overdue: 'Просрочка задачи из Иерархии',
  personal_task_overdue: 'Личная задача просрочена',
  task_not_started: 'Задача не начата вовремя',
  tasks_not_set: 'Не расставил задачи на день до 10:00',
  client_closed_on_time: 'Все задачи по клиенту закрыты в срок',
}

const COMPLEXITY = {
  low: { label: 'Лёгкая', tone: 'bg-danger/10 text-danger', hint: 'В названии и описании почти ничего — непонятно, что сделано' },
  medium: { label: 'Средняя', tone: 'bg-warn-soft text-warn', hint: 'Понятно, что сделано, без подробностей' },
  high: { label: 'Весомая', tone: 'bg-ok/10 text-ok', hint: 'Подробное описание того, что сделано' },
}

const PAGE = 10

export function ReviewSection() {
  const fetchReviews = useMotivationStore((s) => s.fetchReviews)
  const fetchReviewsCount = useMotivationStore((s) => s.fetchReviewsCount)
  const reviews = useMotivationStore((s) => s.reviews)
  // Кнопка из телеграма («Открыть») ведёт сразу в «Ждут решения».
  const [params] = useSearchParams()
  const [view, setView] = useState(() => (params.get('view') === 'pending' ? 'pending' : 'history'))
  const pendingCount = useMotivationStore((s) => s.reviewsPending)
  // Растёт после каждого решения: история перечитывается и показывает его.
  const [historyKey, setHistoryKey] = useState(0)

  useEffect(() => {
    // Счётчик на вкладке мог устареть: ночью пришли заявки.
    fetchReviewsCount()
  }, [fetchReviewsCount, view])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="tablist">
          {[['history', 'История баллов'], ['pending', pendingCount ? `Ждут решения · ${pendingCount}` : 'Ждут решения']].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={cx(
                'rounded-lg px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors',
                view === id ? 'bg-panel-2 text-ink' : 'text-ink-3 hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {view === 'pending' && reviews?.taskPoints && <TaskPointsNote taskPoints={reviews.taskPoints} />}
      </div>

      <PendingQueue
        key={view}
        compact={view === 'history'}
        onDecided={() => setHistoryKey((k) => k + 1)}
      />
      {view === 'history' && <HistoryView isAdmin reloadKey={historyKey} />}
    </div>
  )
}

/**
 * Очередь заявок с кнопками «Начислить» и «Не начислять». В режиме compact
 * это блок над историей: пустая очередь его не показывает, а длинную он
 * выдаёт порциями с кнопкой «Показать ещё».
 */
function PendingQueue({ compact, onDecided }) {
  const { reviews, reviewsLoading, reviewsError, fetchReviews, approveReview, rejectReview, dismissReviews } = useMotivationStore()
  const [done, setDone] = useState(() => new Set())
  const [shown, setShown] = useState(PAGE)
  const [checked, setChecked] = useState(() => new Set())
  const [people, setPeople] = useState(() => new Set())
  const [confirm, setConfirm] = useState(null)

  const load = () => { setDone(new Set()); return fetchReviews('pending') }
  useEffect(() => { load() }, [fetchReviews]) // eslint-disable-line react-hooks/exhaustive-deps
  useAutoRefresh(load)

  const items = (reviews?.items ?? []).filter((r) => !done.has(r.id))
  const toggleChecked = (id) => setChecked((s) => {
    const next = new Set(s)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  // Выбранные галочками и люди из списка вместе: заявка берётся, если подходит под любое.
  const selectedIds = items.filter((r) => checked.has(r.id) || people.has(r.employee.id)).map((r) => r.id)
  const allSelected = items.length > 0 && selectedIds.length === items.length
  // На сервер уходят ids, запомненные при открытии подтверждения: пока окно
  // открыто, список мог обновиться, и снять нужно ровно то, что человек видел.
  async function dismiss(frozen) {
    const body = { ids: frozen.ids }
    const res = await dismissReviews(body)
    if (!res.ok) return res
    setChecked(new Set())
    setPeople(new Set())
    await load()
    onDecided?.()
    return res
  }
  const markDone = (id) => { setDone((s) => new Set(s).add(id)); onDecided?.() }
  // Заявка обновилась, пока на неё смотрели (ночь добавила штраф) — сервер
  // ответит 409, и очередь перечитывается, чтобы владелец увидел новое число.
  const visible = compact ? items.slice(0, shown) : items

  if (reviewsLoading && !reviews) {
    return compact ? null : <div className="grid place-items-center py-14"><Spinner /></div>
  }
  if (reviewsError && !reviews) return compact ? null : <p className="text-sm text-danger">{reviewsError}</p>
  if (items.length === 0) {
    if (compact) return null
    return (
      <Card>
        <EmptyState
          label="Заявок нет"
          text="Сюда приходят только правила, которые в условиях отдела настроены «мне на решение». Остальные баллы начисляются сами и видны в «Истории баллов»."
        />
      </Card>
    )
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Ждут решения">
      {compact && <p className="caption">Ждут решения · {items.length}</p>}
      <CleanupBar
        items={items}
        checked={checked}
        people={people}
        onPeople={setPeople}
        selectedCount={selectedIds.length}
        allSelected={allSelected}
        onToggleAll={() => { setChecked(allSelected ? new Set() : new Set(items.map((r) => r.id))); setPeople(new Set()) }}
        onClean={(kind) => {
          const ids = kind === 'all' ? items.map((r) => r.id) : [...selectedIds]
          if (ids.length) setConfirm({ kind, ids, count: ids.length })
        }}
      />
      <ul className="flex flex-col gap-3">
        {visible.map((r) => (
          <PendingItem
            key={r.id}
            review={r}
            checked={checked.has(r.id) || people.has(r.employee.id)}
            onCheck={() => toggleChecked(r.id)}
            dailyCap={reviews.personalTaskDailyCap}
            onApprove={(body) => approveReview(r.id, body).then((res) => {
              if (res.ok) markDone(r.id)
              else if (/обновилась/.test(res.error || '')) load()
              return res
            })}
            onReject={() => rejectReview(r.id).then((res) => { if (res.ok) markDone(r.id); return res })}
          />
        ))}
      </ul>
      {compact && items.length > visible.length && (
        <div className="flex justify-center">
          <Button size="sm" variant="secondary" onClick={() => setShown((n) => n + PAGE)}>
            Показать ещё · {items.length - visible.length}
          </Button>
        </div>
      )}
      {confirm && <DismissConfirm count={confirm.count} onCancel={() => setConfirm(null)} onConfirm={() => dismiss(confirm)} onDone={() => setConfirm(null)} />}
    </section>
  )
}

/** Панель очистки: выбрать все, выбрать людей, счётчик и кнопки. */
function CleanupBar({ items, people, onPeople, selectedCount, allSelected, onToggleAll, onClean }) {
  const [open, setOpen] = useState(false)
  const list = []
  const seen = new Set()
  for (const r of items) {
    if (seen.has(r.employee.id)) continue
    seen.add(r.employee.id)
    list.push(r.employee)
  }
  list.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  const togglePerson = (id) => {
    const next = new Set(people)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onPeople(next)
  }
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-2">
      <Checkbox label="Выбрать все" checked={allSelected} onChange={onToggleAll} />
      <div className="relative">
        <Button size="sm" variant="secondary" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {people.size ? `Люди · ${people.size}` : 'Выбрать людей'}
        </Button>
        {open && (
          <ul className="absolute left-0 top-full z-20 mt-1 flex max-h-64 w-72 flex-col overflow-y-auto rounded-lg border border-line-2 bg-panel shadow-lg">
            {list.map((e) => (
              <li key={e.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={people.has(e.id)}
                  onClick={() => togglePerson(e.id)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm hover:bg-panel-2"
                >
                  <span className={cx('grid size-4 shrink-0 place-items-center rounded border text-[10px] text-white', people.has(e.id) ? 'border-transparent bg-accent' : 'border-line-2')}>
                    {people.has(e.id) ? '✓' : ''}
                  </span>
                  <span className="truncate">{e.department?.name ? `${e.name}, ${e.department.name}` : e.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <span className="text-sm text-ink-3">Выбрано: {selectedCount}</span>
      <div className="ml-auto flex gap-2">
        <Button size="sm" variant="secondary" disabled={!selectedCount} onClick={() => onClean('selected')}>Очистить выбранные</Button>
        <Button size="sm" variant="ghost" onClick={() => onClean('all')}>Очистить все</Button>
      </div>
    </div>
  )
}

function DismissConfirm({ count, onCancel, onConfirm, onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  async function go() {
    setBusy(true)
    setError(null)
    const res = await onConfirm()
    setBusy(false)
    if (res.ok) onDone()
    else setError(res.error || 'Не удалось снять заявки')
  }
  return (
    <Modal
      open
      onClose={onCancel}
      title="Очистить заявки"
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onCancel}>Отмена</Button>
          <Button variant="danger" loading={busy} onClick={go}>Снять</Button>
        </>
      )}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-2 leading-relaxed">Снять {count} {plural(count, 'заявку', 'заявки', 'заявок')}? Баллы по ним не начислятся, в истории они останутся.</p>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </Modal>
  )
}

function TaskPointsNote({ taskPoints }) {
  const text = !taskPoints.from
    ? 'Баллы за задачи не включены, дата в «Настройках», «Общие параметры»'
    : `Баллы за задачи считаются с ${dayMonth(taskPoints.from)}`
  return <p className="text-xs text-ink-3">{text}</p>
}

function Who({ review }) {
  const e = review.employee
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={e.name} email={e.email} src={e.avatarUrl} color={e.avatarColor} size={32} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{e.name}</span>
        <span className="truncate text-xs text-ink-3">{e.department?.name || 'Без отдела'}</span>
      </div>
    </div>
  )
}

function PendingItem({ review, checked, onCheck, dailyCap, onApprove, onReject }) {
  const [points, setPoints] = useState(String(review.prizePoints))
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const overdue = review.rule === 'task_overdue' || review.rule === 'personal_task_overdue'
  // Сложность нужна, чтобы решить, сколько дать за сделанное, — у штрафа её не показываем.
  const complexity = !overdue && review.complexity && COMPLEXITY[review.complexity]

  async function run(kind) {
    if (busy) return
    setError(null)
    let body
    if (kind === 'approve') {
      const n = Number(points.replace('−', '-'))
      if (!Number.isInteger(n) || n < -100 || n > 100) {
        setError('Баллы — целое число от −100 до 100')
        return
      }
      if (n === 0) {
        setError('Ноль баллов начислять незачем — нажмите «Не начислять»')
        return
      }
      if (Math.sign(n) !== Math.sign(review.prizePoints)) {
        setError(review.prizePoints < 0 ? 'Это штраф — баллы со знаком минус' : 'Это начисление — баллы без минуса')
        return
      }
      body = { prizePoints: n, seenPrizePoints: review.prizePoints }
    }
    setBusy(kind)
    const res = kind === 'approve' ? await onApprove(body) : await onReject()
    setBusy(null)
    if (!res.ok) setError(res.error || 'Не удалось сохранить решение')
  }

  return (
    <li>
      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Checkbox checked={checked} onChange={onCheck} aria-label={`Выбрать заявку ${review.employee.name}`} />
            <Who review={review} />
          </div>
          <span className="text-xs text-ink-3">{dateTime(review.occurredAt)}</span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-ink-2">
            {RULE_LABEL[review.rule]}
            {review.rule === 'task_overdue' && review.nights > 0 && ` · ${review.nights} ${plural(review.nights, 'ночь', 'ночи', 'ночей')}`}
          </p>
          {review.task && <p className="text-sm font-semibold leading-snug">{review.task.title}</p>}
          {review.task?.description && <p className="line-clamp-3 text-sm text-ink-2 leading-relaxed">{review.task.description}</p>}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {complexity && (
              <span className={cx('rounded-md px-1.5 py-0.5 text-xs font-semibold', complexity.tone)} title={complexity.hint}>
                {complexity.label}
              </span>
            )}
            {review.personalDayPoints !== null && review.personalDayPoints !== undefined && (
              <span className="text-xs text-ink-3">
                За личные задачи в этот день уже {pointsWord(review.personalDayPoints)} из {dailyCap}
              </span>
            )}
            {review.task?.deadline && overdue && <span className="text-xs text-ink-3">Срок был {dateTime(review.task.deadline)}</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Input
            size="sm"
            label="Баллы"
            inputMode="numeric"
            className="w-28"
            value={points}
            onChange={(e) => { setError(null); setPoints(e.target.value.replace(/[^\d\-−]/g, '').slice(0, 4)) }}
            aria-label={`Баллы для ${review.employee.name}`}
          />
          <p className="pb-2 text-xs text-ink-3">
            Подсказано <span className={cx('font-semibold', pointsTone(review.prizePoints))}>{signedPoints(review.prizePoints)}</span>
            {review.levelPoints !== review.prizePoints && `, в уровень ${signedPoints(review.levelPoints)}`}
          </p>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" loading={busy === 'reject'} onClick={() => run('reject')}>Не начислять</Button>
            <Button size="sm" loading={busy === 'approve'} onClick={() => run('approve')}>Начислить</Button>
          </div>
        </div>
        {review.previousMonth && (
          <p className="text-xs text-warn">Заявка прошлого месяца: он уже закрыт, поэтому баллы лягут в текущий месяц.</p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </Card>
    </li>
  )
}
