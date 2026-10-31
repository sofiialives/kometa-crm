import { Badge, Button, Card } from '../../shared/ui'

const STATUS_TONE = { pending: 'warn', approved: 'ok', rejected: 'danger', removed: 'neutral' }
const STATUS_LABEL = { pending: 'На рассмотрении', approved: 'Одобрен', rejected: 'Отклонён', removed: 'Снят с одобренных' }

export function AmbassadorCard({ ambassador, canDecide, canRemove, onOpen, onApprove, onReject, onRemove }) {
  const purged = ambassador.status === 'rejected'

  return (
    <Card className="flex flex-col gap-3 cursor-pointer" onClick={() => onOpen(ambassador)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{purged ? `Отклонён (${ambassador.manager?.name || 'без автора'})` : ambassador.contactUsername}</p>
          <p className="caption">{purged ? '' : ambassador.theme}{ambassador.manager?.name ? ` · ${ambassador.manager.name}` : ''}</p>
        </div>
        <Badge tone={STATUS_TONE[ambassador.status]}>{STATUS_LABEL[ambassador.status]}</Badge>
      </div>

      {!purged && (
        <>
          <p className="text-sm text-ink-2 leading-relaxed">{ambassador.conditions}</p>

          {ambassador.managerComment && (
            <p className="text-sm text-ink-3 leading-relaxed">{ambassador.managerComment}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {ambassador.links.map((l) => (
              <span key={l.id} className="text-xs text-accent">{l.label}</span>
            ))}
          </div>

          {ambassador.screenshots.length > 0 && (
            <p className="caption">Скриншотов: {ambassador.screenshots.length} — открыть карточку, чтобы посмотреть</p>
          )}

          {ambassador.callAt && (
            <div className="text-sm text-ink-3">Звонок: {new Date(ambassador.callAt).toLocaleString('ru-RU')}</div>
          )}
        </>
      )}

      {(canDecide || canRemove) && (
        <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {canDecide && (
            <>
              <Button size="sm" onClick={() => onApprove(ambassador)}>Одобрить</Button>
              <Button size="sm" variant="danger" onClick={() => onReject(ambassador)}>Отклонить</Button>
            </>
          )}
          {canRemove && (
            <Button size="sm" variant="danger" onClick={() => onRemove(ambassador)}>Снять с одобренных</Button>
          )}
        </div>
      )}
    </Card>
  )
}
