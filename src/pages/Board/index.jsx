import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBoardStore } from '../../core/store/boardStore'
import { useClientsStore } from '../../core/store/clientsStore'
import { PageSection } from '../../widgets'
import { Button, ConfirmModal, EmptyState, Spinner } from '../../shared/ui'
import { PeriodSwitcher } from '../../components/board/PeriodSwitcher'
import { BoardSummary } from '../../components/board/BoardSummary'
import { BoardCard } from '../../components/board/BoardCard'
import { CardModal } from '../../components/board/CardModal'
import { AddClientModal } from '../../components/board/AddClientModal'
import { ServiceModal } from '../../components/board/ServiceModal'
import { LeaveModal } from '../../components/board/LeaveModal'
import { lastLabel, monthKey, monthLabel } from '../../utils/board'

export default function BoardPage() {
  const {
    summary, active, left, card, months, loading, error,
    fetchBoard, fetchCard, closeCard, fetchMonths,
    addClient, markLeft, markActive, removeClient,
    addService, editService, removeService,
  } = useBoardStore()

  const allClients = useClientsStore((s) => s.clients)
  const fetchAllClients = useClientsStore((s) => s.fetchClients)

  // Период живёт в адресной строке: доска за конкретный месяц — это ссылка,
  // которую можно отложить в закладки или кинуть себе же.
  const [params, setParams] = useSearchParams()
  const period = useMemo(() => ({
    mode: params.get('mode') || 'month',
    month: params.get('month') || monthKey(),
    months: params.get('months') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
  }), [params])

  const setPeriod = useCallback((next) => {
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(next)) {
        if (v) p.set(k, v); else p.delete(k)
      }
      return p
    }, { replace: true })
  }, [setParams])

  const [openId, setOpenId] = useState(null)
  const [cardLoading, setCardLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [serviceModal, setServiceModal] = useState(null)
  // Уход можно запустить и с карточки на доске, и из раскрытой — поэтому
  // держим, по какому именно клиенту открыта форма, а не просто «открыта».
  const [leaveFor, setLeaveFor] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  // Запрос собираем ровно из того, что нужно режиму: лишние даты в режиме
  // месяца сервер отклонит проверкой.
  const request = useMemo(() => {
    if (period.mode === 'all') return { mode: 'all' }
    if (period.mode === 'last') return { mode: 'last', months: period.months || '3' }
    if (period.mode === 'period') return { mode: 'period', from: period.from, to: period.to }
    return { mode: 'month', month: period.month }
  }, [period])

  const ready = period.mode !== 'period' || period.from || period.to

  useEffect(() => { fetchAllClients(); fetchMonths() }, [fetchAllClients, fetchMonths])
  useEffect(() => { if (ready) fetchBoard(request) }, [fetchBoard, request, ready])

  const periodLabel = useMemo(() => {
    if (period.mode === 'all') return 'всё время'
    if (period.mode === 'last') return lastLabel(period.months)
    if (period.mode === 'period') return 'период'
    return monthLabel(period.month)
  }, [period])

  const onBoard = useMemo(
    () => new Set([...active, ...left].map((c) => c.client.id)),
    [active, left],
  )

  async function open(id) {
    setOpenId(id)
    setCardLoading(true)
    await fetchCard(id, request)
    setCardLoading(false)
  }

  const refresh = useCallback(async () => {
    if (ready) await fetchBoard(request)
    if (openId) await fetchCard(openId, request)
    fetchAllClients()
  }, [fetchBoard, fetchCard, fetchAllClients, request, openId, ready])

  // Отказ, о котором не сказали, — худшее, что здесь может быть: цифры
  // финансовые, и человек должен знать, что его правка не сохранилась.
  async function run(action, failMessage) {
    setBusy(true)
    const res = await action()
    setBusy(false)
    if (res?.ok) await refresh()
    else if (failMessage) window.alert(res?.error || failMessage)
    return res
  }

  return (
    <PageSection
      pill="Доска клиентов"
      title="Клиенты"
      subtitle="Кто с нами работает, кто ушёл, и сколько агентство на этом заработало."
      actions={<Button onClick={() => setAddOpen(true)}>Клиент на доску</Button>}
    >
      <BoardSummary summary={summary} periodLabel={periodLabel} />

      <PeriodSwitcher value={period} onChange={setPeriod} monthsWithData={months} />

      {error && <p className="text-sm text-danger">{error}</p>}

      {!ready ? (
        <EmptyState label="Выберите период" text="Задайте хотя бы одну границу диапазона." />
      ) : loading && !summary ? (
        <div className="grid place-items-center py-14"><Spinner /></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Column
            title="В работе"
            cards={active}
            periodLabel={periodLabel}
            onOpen={open}
            onLeave={setLeaveFor}
            onReturn={(c) => run(() => markActive(c.id), 'Не удалось вернуть клиента в работу')}
            empty="Здесь появятся клиенты, с которыми работаем."
            action={<Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>Клиент на доску</Button>}
          />
          <Column
            title="Ушедшие"
            cards={left}
            periodLabel={periodLabel}
            onOpen={open}
            onLeave={setLeaveFor}
            onReturn={(c) => run(() => markActive(c.id), 'Не удалось вернуть клиента в работу')}
            empty="Пока никто не ушёл."
          />
        </div>
      )}

      <CardModal
        open={Boolean(openId)}
        onClose={() => { setOpenId(null); closeCard() }}
        card={card}
        loading={cardLoading}
        periodLabel={periodLabel}
        onAddService={() => setServiceModal({ service: null })}
        onEditService={(service) => setServiceModal({ service })}
        onDeleteService={(service) => setConfirm({ kind: 'service', service })}
        onLeave={() => setLeaveFor(card)}
        onReturn={() => run(() => markActive(openId), 'Не удалось вернуть клиента в работу')}
        onRemove={() => setConfirm({ kind: 'client' })}
      />

      <AddClientModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(body) => run(() => addClient(body))}
        clients={allClients}
        alreadyOnBoard={onBoard}
        defaultMonth={period.mode === 'month' ? period.month : undefined}
      />

      <ServiceModal
        open={Boolean(serviceModal)}
        onClose={() => setServiceModal(null)}
        service={serviceModal?.service}
        defaultMonth={period.mode === 'month' ? period.month : undefined}
        onSubmit={(body) => run(() =>
          serviceModal?.service
            ? editService(serviceModal.service.id, body)
            : addService({ ...body, boardClientId: openId }),
        )}
      />

      <LeaveModal
        open={Boolean(leaveFor)}
        onClose={() => setLeaveFor(null)}
        card={leaveFor}
        onSubmit={(body) => run(() => markLeft(leaveFor.id, body))}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        loading={busy}
        danger
        title={confirm?.kind === 'client' ? 'Убрать клиента с доски?' : 'Удалить услугу?'}
        confirmText="Удалить"
        text={
          confirm?.kind === 'client'
            ? 'Вместе с ним пропадут все его услуги, выручка и расходы за все месяцы. Вернуть их будет нельзя.'
            : 'Услуга и её расходы удалятся, сводка пересчитается.'
        }
        onConfirm={async () => {
          const c = confirm
          setConfirm(null)
          if (c.kind === 'client') {
            const res = await run(() => removeClient(openId), 'Не удалось убрать клиента с доски')
            if (res?.ok) { setOpenId(null); closeCard() }
          } else {
            await run(() => removeService(c.service.id), 'Не удалось удалить услугу')
          }
        }}
      />
    </PageSection>
  )
}

function Column({ title, cards, periodLabel, onOpen, onLeave, onReturn, empty, action }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2 px-1">
        <p className="font-semibold">{title}</p>
        <span className="caption">{cards.length}</span>
      </div>

      {cards.length === 0 ? (
        <EmptyState label="Пусто" text={empty} action={action} />
      ) : (
        <div className="flex flex-col gap-3">
          {cards.map((c) => (
            <BoardCard
              key={c.id}
              card={c}
              periodLabel={periodLabel}
              onOpen={() => onOpen(c.id)}
              onLeave={() => onLeave(c)}
              onReturn={() => onReturn(c)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
