import { useState } from 'react'
import { BankCard } from './BankCard'
import { PrizeScale } from './PrizeScale'
import { EarnedCard } from './EarnedCard'
import { WorkLevelBar } from './WorkLevelBar'
import { PointsHistory } from './PointsHistory'
import { BankHistoryModal } from './BankHistoryModal'
import { monthHeading } from '../../utils/motivation'

/**
 * Экран «Моя мотивация» сверху вниз, как в задании: банк, шкала премии,
 * заработано сейчас, уровень работы, история баллов.
 *
 * Один и тот же компонент показывает человека самому себе, руководителю и
 * владельцу — так цифры у них гарантированно одинаковые. Разница только в
 * правах: владелец может отменить событие прямо из истории.
 */
export function MotivationView({ data, highlight, onCancelEvent }) {
  const [historyOpen, setHistoryOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      {!data.profile && (
        <div className="rounded-card border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn leading-relaxed">
          Профиль должности ещё не назначен, поэтому условия получения баллов пока не заданы. Банк и ручные баллы
          работают, а профиль назначит владелец в «Настройках».
        </div>
      )}

      {!data.isCurrent && (
        <p className="text-sm text-ink-2">
          Итоги за {monthHeading(data.month).toLowerCase()}: банк, баллы и премия на конец месяца.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <BankCard
          bank={data.bank}
          unseenCents={data.unseen?.bankCents || 0}
          isCurrent={data.isCurrent}
          onOpenHistory={() => setHistoryOpen(true)}
        />
        <EarnedCard prize={data.prize} bankCents={data.bank.cents} isCurrent={data.isCurrent} />
      </div>

      <PrizeScale prize={data.prize} highlight={highlight} />
      <WorkLevelBar work={data.work} />
      <PointsHistory
        history={data.history}
        canCancel={Boolean(onCancelEvent) && Boolean(data.permissions?.canCancel)}
        onCancel={onCancelEvent}
      />

      <BankHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={data.bank.history}
        month={data.month}
      />
    </div>
  )
}
