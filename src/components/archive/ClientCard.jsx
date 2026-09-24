import { Badge, Card } from '../../shared/ui'
import { archiveDateShort } from '../../utils/archive'
import { reportsWord, servicesWord } from '../../utils/archive'

/** Карточка клиента в сетке. Открывается по клику — внутри услуги и отчёты. */
export function ClientCard({ card, onOpen }) {
  const empty = card.serviceCount === 0

  return (
    <Card
      hover
      pad="sm"
      onClick={onOpen}
      className="flex h-full cursor-pointer flex-col gap-3"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 truncate font-semibold leading-snug">{card.client.name}</p>
        {empty
          ? <Badge tone="warn">Пока пусто</Badge>
          : <Badge tone="brand">{reportsWord(card.reportCount)}</Badge>}
      </div>

      {card.departments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {card.departments.map((d) => (
            <span key={d.id} className="rounded-md border border-line bg-panel-2 px-2 py-0.5 text-xs text-ink-2">
              {d.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
        {empty ? (
          <span>Услуг ещё нет — заведите первую</span>
        ) : (
          <>
            <span>{servicesWord(card.serviceCount)}</span>
            {card.lastReportAt && (
              <>
                <span aria-hidden="true">·</span>
                <span>последний {archiveDateShort(card.lastReportAt)}</span>
              </>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
