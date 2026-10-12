import { Button, Card } from '../../shared/ui'
import { EMPTY_BANK_TEXT, dollars, money } from '../../utils/motivation'

/**
 * Банк премии: крупное число и кнопка истории. Это первое, что видит
 * сотрудник во вкладке, поэтому ничего лишнего.
 *
 * Пустой банк — не ноль долларов, а объяснение, откуда он берётся: в
 * начале месяца пусто у всех, и голый «$0» читался бы как наказание.
 */
export function BankCard({ bank, unseenCents, isCurrent, onOpenHistory }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="caption">{isCurrent ? 'В банке' : 'Банк за месяц'}</p>
          {bank.isEmpty ? (
            <p className="text-sm text-ink-2 leading-relaxed max-w-md">{EMPTY_BANK_TEXT}</p>
          ) : (
            <p className="font-display text-4xl font-bold tracking-tight tabular-nums">{dollars(bank.cents)}</p>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={onOpenHistory}>История банка</Button>
      </div>

      {unseenCents > 0 && (
        // «+50 $ в банке» из задания: короткая подсветка, пока человек не
        // увидел пополнение. Гаснет, когда он открыл вкладку.
        <div className="self-start rounded-lg border border-ok/30 bg-ok-soft px-3 py-1.5 text-sm font-semibold text-ok animate-fade-in">
          +{money(unseenCents)} в банке
        </div>
      )}
    </Card>
  )
}
