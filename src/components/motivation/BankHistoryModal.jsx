import { EmptyState, Modal } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { bankEntryLabel, dateTime, money, monthTitle } from '../../utils/motivation'

/**
 * История банка: дата, сумма, причина и клиент. Списания тоже здесь —
 * минусом и с комментарием, почему банк уменьшили.
 */
export function BankHistoryModal({ open, onClose, entries = [], month }) {
  return (
    <Modal open={open} onClose={onClose} title={`История банка — ${monthTitle(month)}`} size="md">
      {entries.length === 0 ? (
        <EmptyState label="Пополнений нет" text="В этом месяце банк ещё не пополняли." />
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">
                    {bankEntryLabel(e)}
                    {e.isNew && <span className="ml-2 rounded-md bg-accent-soft px-1.5 py-0.5 text-xs font-semibold text-accent">новое</span>}
                  </p>
                  <p className="text-xs text-ink-3">
                    {dateTime(e.occurredAt)}
                    {e.createdBy ? ` · ${e.createdBy.name}` : ''}
                  </p>
                </div>
                <p className={cx('shrink-0 text-base font-semibold tabular-nums', e.amountCents < 0 ? 'text-danger' : 'text-ok')}>
                  {e.amountCents > 0 ? '+' : ''}{money(e.amountCents)}
                </p>
              </div>
              {e.client && <p className="text-xs text-ink-2">Клиент: {e.client.name}</p>}
              {e.comment && <p className="text-sm text-ink-2 leading-relaxed">{e.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
