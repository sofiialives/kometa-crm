import { Avatar, Button } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { archiveDateShort, fileSize } from '../../utils/archive'

/**
 * Строка отчёта. Заголовка у отчёта нет — заказчик сказал, что поля не
 * нужны, файл приносят готовым. Поэтому в списке имя файла, как его
 * назвал автор.
 */
export function ReportRow({ report, onOpen, onDelete, canDelete, showContext }) {
  return (
    <div className="group flex items-center gap-3 rounded-[10px] border border-line px-3 py-2.5 transition-colors hover:border-line-2 hover:bg-panel-2">
      <PdfIcon />

      <button
        onClick={onOpen}
        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left cursor-pointer"
      >
        <span className="w-full truncate text-sm font-medium group-hover:text-accent transition-colors">
          {report.fileName}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-3">
          {showContext && report.service && (
            <>
              <span className="truncate">{report.service.archiveClient?.client?.name}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{report.service.title}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span className="tabular-nums">{archiveDateShort(report.workedAt)}</span>
          {report.fileSize ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{fileSize(report.fileSize)}</span>
            </>
          ) : null}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <Avatar
          name={report.author?.name}
          src={report.author?.avatarUrl}
          color={report.author?.avatarColor}
          size={26}
          title={report.author?.name}
        />
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            className={cx('!text-ink-3 hover:!text-danger', 'opacity-0 group-hover:opacity-100 focus:opacity-100')}
            onClick={onDelete}
            aria-label="Удалить отчёт"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  )
}

function PdfIcon() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-danger-soft text-danger">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    </span>
  )
}
