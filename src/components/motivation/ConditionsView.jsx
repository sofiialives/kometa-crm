import { Card, EmptyState } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { dayMonth, dollars, eventPoints, modeLabel, money, pointsTone, pointsUnit, pointsWord } from '../../utils/motivation'

/**
 * «Мои условия»: правила игры для своей должности, заранее. Человек должен
 * понимать, чем он может заработать баллы и за что их потеряет, до того
 * как это случилось, — ради этого панель и заведена.
 *
 * Только чтение. Всё берётся из профиля, поэтому после его правки панель
 * обновляется сама. Таблицы на телефоне превращаются в карточки: колонок
 * четыре, и в узкий экран они не влезают.
 *
 * Те же условия открываются из карточки сотрудника у владельца и
 * руководителя — там `self` выключен, и «Мой профиль» становится «Профиль».
 */
export function ConditionsView({ data, self = true }) {
  if (!data.profile) {
    return (
      <Card>
        <EmptyState
          label="Профиль не назначен"
          text="Условия появятся, когда владелец назначит профиль должности. До этого банк и ручные баллы работают как обычно."
        />
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="caption">{self ? 'Мой профиль' : 'Профиль'}</p>
          <p className="font-display text-xl font-bold tracking-tight">{data.profile.title}</p>
        </div>
        <p className="text-sm text-ink-3">Условия обновлены {dayMonth(data.profile.conditionsUpdatedAt)}</p>
      </Card>

      <EventsTable title="Как заработать баллы" events={data.earn} empty="В профиле пока нет событий, за которые добавляются баллы." />
      <EventsTable title="За что снимаются баллы" events={data.penalties} empty="В профиле нет штрафов." rules={data.rules} />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="caption">Мои уровни премии</p>
          <p className="text-xs text-ink-3">
            {data.scale === 'custom' ? 'Своя шкала профиля' : 'Общая шкала агентства'} · в банке сейчас {dollars(data.bankCents)}
          </p>
        </div>
        <ul className="grid gap-2">
          {data.prizeLevels.map((l) => (
            <li key={l.position} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-sm">
              <span className="font-semibold">Уровень {l.position}</span>
              <span className="text-ink-2">
                от {pointsWord(l.threshold)} · {l.percent}% банка
                {l.fixed && <span className="text-ink-3"> · зафиксирован</span>}
              </span>
              <span className="font-semibold tabular-nums">{dollars(l.amountCents)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-4">
        <p className="caption">Мои уровни работы</p>
        <ul className="grid gap-2">
          {data.workLevels.map((l) => (
            <li key={l.position} className="flex flex-col gap-1 rounded-lg border border-line px-3 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">{l.title}</span>
                <span className="text-xs text-ink-3 tabular-nums">{l.minPoints}–{l.maxPoints} {pointsUnit(l.maxPoints)}</span>
              </div>
              {l.hint && <p className="text-sm text-ink-2 leading-relaxed">{l.hint}</p>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="caption">Как устроен банк</p>
        <ul className="flex flex-col gap-2 text-sm text-ink-2 leading-relaxed">
          <li>
            У каждого свой банк на месяц. В начале месяца он
            {data.rules.startBankCents > 0 ? ` равен ${money(data.rules.startBankCents)}` : ' пуст'} и пополняется, когда
            приходят новые клиенты и появляется свободный бюджет.
          </li>
          <li>
            Баллы открывают долю банка: чем выше уровень, тем больше доля. Премия считается ступенями и не
            суммируется — на третьем уровне вы получаете сумму третьего уровня, а не всех трёх вместе.
          </li>
          <li>
            Когда банк растёт, деньги добавляются к уровням, до которых вы ещё не дошли. Уровень, на котором вы уже
            стоите, фиксирует свою сумму — дальше выгоднее подниматься, а не ждать.
          </li>
          <li>Первого числа баллы и банк обнуляются. К выплате идёт сумма уровня, на котором вы закончили месяц.</li>
        </ul>
      </Card>
    </div>
  )
}

function EventsTable({ title, events, empty, rules }) {
  return (
    <Card className="flex flex-col gap-4">
      <p className="caption">{title}</p>
      {events.length === 0 ? (
        <p className="text-sm text-ink-3">{empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {events.map((e) => (
            <li key={e.id} className="grid gap-1.5 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:gap-x-6">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-snug">{e.title}</p>
                {e.example && <p className="text-xs text-ink-3 leading-relaxed">Например: {e.example}</p>}
                <p className="text-xs text-ink-2">{modeLabel(e)}</p>
              </div>
              <p className={cx('text-sm font-semibold tabular-nums sm:text-right', pointsTone(e.prizePoints || e.levelPoints))}>
                {eventPoints(e)}
              </p>
            </li>
          ))}
        </ul>
      )}
      {rules && events.some((e) => e.autoRule === 'task_overdue') && (
        <p className="text-xs text-ink-3 leading-relaxed">
          Штраф за просрочку одной задачи не больше {pointsWord(rules.overduePenaltyCap)}, сколько бы дней она ни висела.
          Если дедлайн перенесли до того, как он наступил, штрафа нет.
        </p>
      )}
    </Card>
  )
}
