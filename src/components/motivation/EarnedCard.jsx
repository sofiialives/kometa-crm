import { Card } from '../../shared/ui'
import { dollars, pointsWord } from '../../utils/motivation'

/**
 * «Заработано сейчас: 100 $ из 200 $» и под этим, сколько осталось до
 * следующего уровня и сколько он даст. Строки — из задания почти дословно:
 * это ответ на главный вопрос сотрудника «что мне будет, если поднажать».
 */
export function EarnedCard({ prize, bankCents, isCurrent }) {
  const atTop = prize.next === null && prize.currentLevel > 0

  return (
    <Card className="flex flex-col gap-2">
      <p className="caption">{isCurrent ? 'Заработано сейчас' : 'Премия за месяц'}</p>
      <p className="font-display text-3xl font-bold tracking-tight tabular-nums">
        {dollars(prize.earnedCents)}
        <span className="text-lg font-semibold text-ink-3"> из {dollars(bankCents)}</span>
      </p>

      {isCurrent && (
        <p className="text-sm text-ink-2 leading-relaxed">
          {atTop
            ? 'Вы на последнем уровне и забираете весь банк.'
            : prize.next && (
              <>
                До {prize.currentLevel === 0 ? 'первого' : 'следующего'} уровня осталось{' '}
                <span className="font-semibold text-ink">{pointsWord(prize.next.pointsLeft)}</span>
                {prize.next.amountCents > 0 ? <>, он даст <span className="font-semibold text-ink">{dollars(prize.next.amountCents)}</span></> : null}.
              </>
            )}
        </p>
      )}
      {!isCurrent && (
        <p className="text-sm text-ink-2">
          {prize.currentLevel > 0 ? `Уровень ${prize.currentLevel} на конец месяца.` : 'Ни один уровень в этом месяце не пройден.'}
        </p>
      )}
    </Card>
  )
}
