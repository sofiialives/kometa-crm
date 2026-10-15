import { useEffect, useState } from 'react'
import { Avatar, Button, Card, EmptyState, Input, Spinner } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { useMotivationStore } from '../../core/store/motivationStore'
import { dateTime, dayMonth, pointsTone, pointsWord, signedPoints } from '../../utils/motivation'
import { plural } from '../../shared/lib/plural'
import { HintsBlock } from './HintsBlock'
import { HistoryView } from './HistoryView'
import { useAutoRefresh } from '../../shared/lib/useAutoRefresh'

/**
 * «История баллов» владельца: все начисления с фильтрами и рядом «Ждут
 * решения» — заявки по правилам, которые владелец настроил «мне на
 * решение», и подсказки пополнить банк за новые работы.
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
}

const COMPLEXITY = {
  low: { label: 'Лёгкая', tone: 'bg-danger/10 text-danger', hint: 'В названии и описании почти ничего — непонятно, что сделано' },
  medium: { label: 'Средняя', tone: 'bg-warn-soft text-warn', hint: 'Понятно, что сделано, без подробностей' },
  high: { label: 'Весомая', tone: 'bg-ok/10 text-ok', hint: 'Подробное описание того, что сделано' },
}

export function ReviewSection() {
  const { reviews, reviewsLoading, reviewsError, fetchReviews, approveReview, rejectReview } = useMotivationStore()
  // Заявка обновилась, пока на неё смотрели (ночь добавила штраф) — сервер
  // ответит 409, и очередь перечитывается, чтобы владелец увидел новое число.
  const refresh = () => { setDone(new Set()); fetchReviews(view) }
  const [view, setView] = useState('history')
  const pendingCount = useMotivationStore((s) => s.reviewsPending)
  const [done, setDone] = useState(() => new Set())

  const fetchReviewsCount = useMotivationStore((s) => s.fetchReviewsCount)
  useEffect(() => {
    // Счётчик на вкладке мог устареть: ночью пришли заявки, днём — работы.
    fetchReviewsCount()
    if (view !== 'pending') return
    setDone(new Set())
    fetchReviews('pending')
  }, [fetchReviews, fetchReviewsCount, view])
  useAutoRefresh(() => { if (view === 'pending') { setDone(new Set()); fetchReviews('pending') } })

  const items = (reviews?.items ?? []).filter((r) => !done.has(r.id))
  const markDone = (id) => setDone((s) => new Set(s).add(id))

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

      {view === 'history' && <HistoryView isAdmin />}
      {view === 'pending' && <HintsBlock />}

      {view !== 'pending' ? null : reviewsLoading && !reviews ? (
        <div className="grid place-items-center py-14"><Spinner /></div>
      ) : reviewsError && !reviews ? (
        <p className="text-sm text-danger">{reviewsError}</p>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            label="Заявок нет"
            text="Сюда приходят только правила, которые в условиях отдела настроены «мне на решение». Остальные баллы начисляются сами и видны в «Истории баллов»." 
          />
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
              <PendingItem
                key={r.id}
                review={r}
                dailyCap={reviews.personalTaskDailyCap}
                onApprove={(body) => approveReview(r.id, body).then((res) => {
                  if (res.ok) markDone(r.id)
                  else if (/обновилась/.test(res.error || '')) refresh()
                  return res
                })}
                onReject={() => rejectReview(r.id).then((res) => { if (res.ok) markDone(r.id); return res })}
              />
          ))}
        </ul>
      )}
    </div>
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

function PendingItem({ review, dailyCap, onApprove, onReject }) {
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
          <Who review={review} />
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
