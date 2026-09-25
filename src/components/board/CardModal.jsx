import { AddAction, Badge, Button, EmptyState, Modal, Spinner } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { dateLabel, marginText, money, monthLabel, servicesWord, tenure } from '../../utils/board'

/**
 * Развёрнутая карточка: услуги выбранного периода, под каждой её расходы и
 * посчитанная прибыль.
 *
 * Все суммы приходят с сервера уже посчитанными. Здесь ничего не считается —
 * иначе две арифметики однажды разойдутся.
 */
export function CardModal({
  open, onClose, card, loading, periodLabel,
  onAddService, onEditService, onDeleteService, onLeave, onReturn, onRemove,
}) {
  const left = card?.status === 'left'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={card?.client?.name || 'Клиент'}
      footer={card ? (
        <>
          <Button variant="ghost" className="!text-danger mr-auto" onClick={onRemove}>
            Убрать с доски
          </Button>
          {left
            ? <Button variant="secondary" onClick={onReturn}>Вернуть в работу</Button>
            : <Button variant="danger" onClick={onLeave}>Клиент ушёл</Button>}
        </>
      ) : null}
    >
      {loading || !card ? (
        <div className="grid place-items-center py-10"><Spinner /></div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {left ? <Badge tone="danger">Ушёл</Badge> : <Badge tone="ok">В работе</Badge>}
                <span className="text-xs text-ink-3">
                  с нами {tenure(card.daysWithUs)}, с {dateLabel(card.startedAt)}
                </span>
              </div>
              {card.contact && <p className="text-sm text-ink-2">{card.contact}</p>}
              {left && card.leftReason && (
                <p className="text-sm text-ink-3">
                  Ушёл {dateLabel(card.leftAt)} — {card.leftReason}
                </p>
              )}
            </div>

            <div className="flex gap-6">
              <Figure label={`Выручка · ${periodLabel}`} value={money(card.revenueCents)} />
              <Figure
                label={`Прибыль · ${periodLabel}`}
                value={money(card.profitCents)}
                tone={card.profitCents < 0 ? 'text-danger' : 'text-ok'}
                note={marginText(card.profitCents, card.revenueCents)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="caption">Услуги · {periodLabel}</p>
              <p className="caption">{servicesWord(card.serviceCountTotal)} за всё время</p>
            </div>

            {card.services.length === 0 ? (
              <EmptyState
                label="Пусто"
                text="В этом периоде услуг не было. Добавьте их или переключите период наверху доски."
              />
            ) : (
              card.services.map((s) => (
                <ServiceBlock
                  key={s.id}
                  service={s}
                  onEdit={() => onEditService(s)}
                  onDelete={() => onDeleteService(s)}
                />
              ))
            )}

            <AddAction onClick={onAddService}>Добавить услугу</AddAction>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Figure({ label, value, tone, note }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="caption whitespace-nowrap">{label}</span>
      <span className={cx('font-display text-xl font-bold tabular-nums', tone)}>{value}</span>
      {note && <span className="text-xs text-ink-3 tabular-nums">{note}</span>}
    </div>
  )
}

function ServiceBlock({ service, onEdit, onDelete }) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate font-semibold leading-snug">{service.title}</p>
          <span className="caption">{monthLabel(service.month)}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>Изменить</Button>
          <Button variant="ghost" size="sm" className="!text-ink-3 hover:!text-danger" onClick={onDelete}>
            Удалить
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Line label="Выручка" value={money(service.revenueCents)} />

        {service.expenses.map((e) => (
          <Line key={e.id} label={e.title} value={`− ${money(e.amountCents)}`} muted indent />
        ))}

        {service.expenses.length === 0 && (
          <p className="pl-3 text-xs text-ink-3">Расходов нет</p>
        )}

        <div className="mt-1 border-t border-line pt-2">
          <Line
            label="Прибыль"
            note={marginText(service.profitCents, service.revenueCents)}
            value={money(service.profitCents)}
            tone={service.profitCents < 0 ? 'text-danger' : 'text-ok'}
            strong
          />
        </div>
      </div>
    </section>
  )
}

function Line({ label, value, tone, muted, indent, strong, note }) {
  return (
    <div className={cx('flex items-baseline justify-between gap-3', indent && 'pl-3')}>
      {/* Подпись и пометка про долю держим вместе слева, чтобы суммы
          справа остались в одной колонке и читались столбиком. */}
      <span className="flex min-w-0 items-baseline gap-2">
        <span className={cx('min-w-0 truncate text-sm', muted ? 'text-ink-3' : 'text-ink-2')} title={label}>
          {label}
        </span>
        {note && <span className="shrink-0 text-xs text-ink-3 tabular-nums">{note}</span>}
      </span>
      <span className={cx('shrink-0 tabular-nums', strong ? 'text-sm font-semibold' : 'text-sm', tone, muted && 'text-ink-3')}>
        {value}
      </span>
    </div>
  )
}
