import { AddAction, Badge, Button, EmptyState, Modal, Spinner } from '../../shared/ui'
import { ReportRow } from './ReportRow'
import { archiveDate, reportsWord } from '../../utils/archive'

/**
 * Карточка клиента изнутри: услуги и отчёты под ними.
 *
 * Это главный экран для онбординга — открыл клиента и прочитал историю
 * работы с ним сверху вниз. Поэтому услуги раскрыты сразу, а не спрятаны
 * за ещё одним кликом.
 */
export function ClientModal({
  open, onClose, data, loading, rights,
  onAddService, onEditService, onDeleteService, onUpload, onOpenReport, onDownloadReport, onDeleteReport, onRemoveClient,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={data?.client?.name || 'Клиент'}
      footer={
        rights.canRemoveClient && data ? (
          <Button variant="ghost" className="!text-danger mr-auto" onClick={onRemoveClient}>
            Убрать из архива
          </Button>
        ) : null
      }
    >
      {loading || !data ? (
        <div className="grid place-items-center py-10"><Spinner /></div>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-xs text-ink-3">
            В архиве с {archiveDate(data.createdAt)}
            {data.addedBy?.name ? `, занёс ${data.addedBy.name}` : ''}
          </p>

          {data.services.length === 0 ? (
            <EmptyState
              label="Услуг нет"
              text={
                rights.canManageServices
                  ? 'Заведите услугу, которой занимались для этого клиента, и складывайте отчёты под неё.'
                  : 'Услуги заводит руководитель отдела. Как появится — сюда можно будет заливать отчёты.'
              }
            />
          ) : (
            data.services.map((service) => (
              <ServiceBlock
                key={service.id}
                service={service}
                rights={rights}
                onEdit={() => onEditService(service)}
                onDelete={() => onDeleteService(service)}
                onUpload={() => onUpload(service)}
                onOpenReport={onOpenReport}
                onDownloadReport={onDownloadReport}
                onDeleteReport={onDeleteReport}
              />
            ))
          )}

          {rights.canManageServices && (
            <AddAction onClick={onAddService}>Добавить услугу</AddAction>
          )}
        </div>
      )}
    </Modal>
  )
}

function ServiceBlock({ service, rights, onEdit, onDelete, onUpload, onOpenReport, onDownloadReport, onDeleteReport }) {
  const canWrite = rights.canUploadTo(service.departmentId)
  const canManage = rights.canManageServiceIn(service.departmentId)

  return (
    <section className="flex flex-col gap-3 rounded-card border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="truncate font-semibold leading-snug">{service.title}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge>{service.department?.name}</Badge>
            <span className="text-xs text-ink-3">{reportsWord(service.reports.length)}</span>
          </div>
        </div>

        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>Переименовать</Button>
            <Button variant="ghost" size="sm" className="!text-ink-3 hover:!text-danger" onClick={onDelete}>
              Удалить
            </Button>
          </div>
        )}
      </div>

      {service.reports.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {service.reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              onOpen={() => onOpenReport(report)}
              onDownload={() => onDownloadReport(report)}
              onDelete={() => onDeleteReport(report, service)}
              canDelete={rights.canDeleteReport(report, service.departmentId)}
            />
          ))}
        </div>
      )}

      {canWrite ? (
        <AddAction onClick={onUpload}>Загрузить отчёт</AddAction>
      ) : service.reports.length === 0 ? (
        <p className="text-xs text-ink-3">Отчётов пока нет</p>
      ) : null}
    </section>
  )
}
