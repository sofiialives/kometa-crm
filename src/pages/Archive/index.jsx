import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../core/store/authStore'
import { useArchiveStore } from '../../core/store/archiveStore'
import { useClientsStore } from '../../core/store/clientsStore'
import { useDepartmentsStore } from '../../core/store/departmentsStore'
import { PageSection } from '../../widgets'
import { Button, ConfirmModal, EmptyState, Spinner } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { DeptTabs } from '../../components/tasks/DeptTabs'
import { ArchiveFilters } from '../../components/archive/ArchiveFilters'
import { ClientCard } from '../../components/archive/ClientCard'
import { ClientModal } from '../../components/archive/ClientModal'
import { AddClientModal } from '../../components/archive/AddClientModal'
import { ServiceModal } from '../../components/archive/ServiceModal'
import { UploadModal } from '../../components/archive/UploadModal'
import { ReportRow } from '../../components/archive/ReportRow'
import { reportsWord } from '../../utils/archive'

const ALL = 'all'
const PAGE = 30

// Два режима — это прямой ответ на «гибкую фильтрацию» из задания.
// «По клиентам» отвечает на вопрос «покажи мне этого клиента целиком»
// (так учится новичок), «Поиск» — на «найди вот тот отчёт» (так делают
// работу над ошибками). Одним списком оба сценария не закрываются.
const MODES = [
  { id: 'clients', label: 'По клиентам' },
  { id: 'reports', label: 'Поиск по отчётам' },
]

export default function ArchivePage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const isLead = user?.role === 'lead'

  const {
    clients, openClient, reports, reportsTotal, authors, serviceTitles, loading, error,
    fetchClients, fetchClient, closeClient, addClient, removeClient,
    createService, editService, removeService,
    fetchReports, fetchAuthors, fetchServiceTitles, uploadReport, removeReport, openReportFile,
  } = useArchiveStore()

  const allClients = useClientsStore((s) => s.clients)
  const fetchAllClients = useClientsStore((s) => s.fetchClients)
  const departments = useDepartmentsStore((s) => s.departments)
  const fetchDepartments = useDepartmentsStore((s) => s.fetchDepartments)

  // Фильтры живут в адресе: ссылкой на выборку можно поделиться.
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => ({
    mode: params.get('mode') || 'clients',
    dept: params.get('dept') || ALL,
    q: params.get('q') || '',
    clientId: params.get('clientId') || '',
    serviceTitle: params.get('serviceTitle') || '',
    authorId: params.get('authorId') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
  }), [params])

  // Строка листания живёт рядом с фильтрами: сбрасывать её отдельным
  // эффектом нельзя — тот успевал сработать после запроса, и на смену
  // фильтра уходило два обращения к серверу, причём первое со старым
  // смещением и в режиме «дозагрузить».
  const [page, setPage] = useState(0)

  const setFilters = useCallback((patch) => {
    setPage(0)
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v)
        else next.delete(k)
      }
      return next
    }, { replace: true })
  }, [setParams])

  // Поиск не дёргает сервер на каждую букву.
  const [debouncedQ, setDebouncedQ] = useState(filters.q)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q), 300)
    return () => clearTimeout(t)
  }, [filters.q])

  const departmentId = filters.dept === ALL ? '' : filters.dept

  const [openId, setOpenId] = useState(null)
  const [clientLoading, setClientLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [serviceModal, setServiceModal] = useState(null)
  const [uploadFor, setUploadFor] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { fetchDepartments(); fetchAllClients() }, [fetchDepartments, fetchAllClients])

  // Карточки клиентов нужны обоим режимам: в первом это сетка, во втором
  // из них собирается список для фильтра «Клиент».
  useEffect(() => {
    fetchClients({
      departmentId,
      q: filters.mode === 'clients' ? debouncedQ : '',
      serviceTitle: filters.serviceTitle,
    })
  }, [fetchClients, departmentId, debouncedQ, filters.mode, filters.serviceTitle])

  useEffect(() => {
    fetchAuthors(departmentId)
    fetchServiceTitles(departmentId)
  }, [fetchAuthors, fetchServiceTitles, departmentId])

  // Поиск набирают в поле, а не через setFilters — сбрасываем отдельно.
  useEffect(() => { setPage(0) }, [debouncedQ])

  useEffect(() => {
    if (filters.mode !== 'reports') return
    fetchReports({
      departmentId,
      clientId: filters.clientId,
      serviceTitle: filters.serviceTitle,
      authorId: filters.authorId,
      from: filters.from,
      to: filters.to,
      q: debouncedQ,
      limit: PAGE,
      offset: page * PAGE,
    }, { append: page > 0 })
  }, [fetchReports, filters.mode, departmentId, filters.clientId, filters.serviceTitle, filters.authorId, filters.from, filters.to, debouncedQ, page])

  const rights = useMemo(() => ({
    canAddClient: isAdmin || isLead,
    canRemoveClient: isAdmin,
    // Услугу заводит любой сотрудник у себя в отделе — так решил заказчик,
    // за ним остались только клиенты.
    canManageServices: isAdmin || Boolean(user?.departmentId),
    // А менять уже не любой: под услугой лежат чужие отчёты, и
    // переименование меняет то, что видят остальные.
    canChangeService: (service) =>
      isAdmin
      || service.createdBy?.id === user?.id
      || (isLead && user?.departmentId === service.departmentId),
    canUploadTo: (deptId) => isAdmin || user?.departmentId === deptId,
    canDeleteReport: (report, deptId) =>
      isAdmin || report.author?.id === user?.id || (isLead && user?.departmentId === deptId),
  }), [isAdmin, isLead, user])

  // Услугу заводят только в своём отделе — предлагать чужие в выпадающем
  // списке значило бы показывать заведомый отказ.
  const pickableDepartments = useMemo(
    () => (isAdmin ? departments : departments.filter((d) => d.id === user?.departmentId)),
    [isAdmin, departments, user],
  )

  const inArchive = useMemo(() => new Set(clients.map((c) => c.client.id)), [clients])
  // Список для выпадающего фильтра «Клиент» копим отдельно и не сужаем
  // выбранной услугой: иначе, выбрав услугу, человек увидел бы в списке
  // клиентов ровно одного и не смог бы переключиться.
  const [clientOptions, setClientOptions] = useState([])
  useEffect(() => {
    if (filters.serviceTitle) return
    setClientOptions(clients.map((c) => c.client))
  }, [clients, filters.serviceTitle])

  const filterClients = useMemo(
    () => [...clientOptions].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [clientOptions],
  )

  async function open(id) {
    setOpenId(id)
    setClientLoading(true)
    await fetchClient(id)
    setClientLoading(false)
  }

  const refresh = useCallback(async () => {
    await fetchClients({ departmentId, q: filters.mode === 'clients' ? debouncedQ : '' })
    if (openId) await fetchClient(openId)
    fetchAuthors(departmentId)
  }, [fetchClients, fetchClient, fetchAuthors, departmentId, debouncedQ, filters.mode, openId])

  async function run(action, failMessage) {
    setBusy(true)
    const res = await action()
    setBusy(false)
    if (res?.ok) await refresh()
    // Молча проглоченный отказ — худшее, что здесь может быть: человек
    // жмёт «Удалить», окно закрывается, и всё остаётся на месте без
    // единого слова. Способ показа тот же, что в Задачах и Звонках.
    else if (failMessage) window.alert(res?.error || failMessage)
    return res
  }

  const tabs = useMemo(
    () => (isAdmin ? [{ id: ALL, name: 'Все отделы' }, ...departments] : []),
    [isAdmin, departments],
  )

  return (
    <PageSection
      pill="Архив"
      title="Архив отчётов"
      subtitle="История работы с клиентами: что делали, как прошло и на что смотреть в следующий раз."
      actions={rights.canAddClient && (
        <Button onClick={() => setAddOpen(true)}>Клиент в архив</Button>
      )}
    >
      {tabs.length > 0 && (
        <DeptTabs departments={tabs} active={filters.dept} onSelect={(id) => setFilters({ dept: id === ALL ? '' : id })} />
      )}

      <div className="flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setFilters({ mode: m.id === 'clients' ? '' : m.id })}
            className={cx(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
              filters.mode === m.id ? 'bg-accent text-white' : 'panel text-ink-3 hover:text-ink',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <ArchiveFilters
        value={{
          q: filters.q,
          clientId: filters.clientId,
          serviceTitle: filters.serviceTitle,
          authorId: filters.authorId,
          from: filters.from,
          to: filters.to,
        }}
        onChange={(v) => setFilters(v)}
        clients={filterClients}
        services={serviceTitles}
        authors={authors}
        onReset={() => setFilters({ q: '', clientId: '', serviceTitle: '', authorId: '', from: '', to: '' })}
      />

      {/* Без этого сотрудник без отдела видел бы «Архив пуст» вместо
          объяснения, почему архив ему недоступен. */}
      {error && <p className="text-sm text-danger">{error}</p>}

      {filters.mode === 'clients' ? (
        <ClientsGrid clients={clients} loading={loading} onOpen={open} canAdd={rights.canAddClient} onAdd={() => setAddOpen(true)} />
      ) : (
        <ReportsList
          reports={reports}
          total={reportsTotal}
          loading={loading}
          rights={rights}
          onOpen={(r) => openReportFile(r.id, r.fileName)}
          onDownload={(r) => openReportFile(r.id, r.fileName, { download: true })}
          onDelete={(r) => setConfirm({ kind: 'report', report: r, departmentId: r.service?.department?.id })}
          onMore={() => setPage((p) => p + 1)}
        />
      )}

      <ClientModal
        open={Boolean(openId)}
        onClose={() => { setOpenId(null); closeClient() }}
        data={openClient}
        loading={clientLoading}
        rights={rights}
        onAddService={() => setServiceModal({ service: null })}
        onEditService={(service) => setServiceModal({ service })}
        onDeleteService={(service) => setConfirm({ kind: 'service', service })}
        onUpload={(service) => setUploadFor(service)}
        onOpenReport={(r) => openReportFile(r.id, r.fileName)}
        onDownloadReport={(r) => openReportFile(r.id, r.fileName, { download: true })}
        onDeleteReport={(report, service) => setConfirm({ kind: 'report', report, departmentId: service.departmentId })}
        onRemoveClient={() => setConfirm({ kind: 'client' })}
      />

      <AddClientModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(clientId, dept) => run(() => addClient(clientId, dept))}
        clients={allClients}
        alreadyInArchive={inArchive}
        departments={tabs}
        departmentId={departmentId || (isAdmin ? '' : user?.departmentId || '')}
      />

      <ServiceModal
        open={Boolean(serviceModal)}
        onClose={() => setServiceModal(null)}
        service={serviceModal?.service}
        departments={pickableDepartments}
        defaultDepartmentId={departmentId || user?.departmentId}
        onSubmit={({ title, departmentId: deptId }) => run(() =>
          serviceModal?.service
            ? editService(serviceModal.service.id, title)
            : createService({ archiveClientId: openId, departmentId: deptId, title }),
        )}
      />

      <UploadModal
        open={Boolean(uploadFor)}
        onClose={() => setUploadFor(null)}
        service={uploadFor}
        onSubmit={({ file, workedAt }) => run(() => uploadReport({ serviceId: uploadFor.id, workedAt, file }))}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        loading={busy}
        danger
        title={
          confirm?.kind === 'client' ? 'Убрать клиента из архива?'
            : confirm?.kind === 'service' ? 'Удалить услугу?'
              : 'Удалить отчёт?'
        }
        confirmText="Удалить"
        text={
          confirm?.kind === 'client'
            ? 'Вместе с ним исчезнут все его услуги и отчёты. Восстановить их будет нельзя.'
            : confirm?.kind === 'service'
              ? `Отчёты под этой услугой (${reportsWord(confirm?.service?.reports?.length || 0)}) удалятся вместе с ней.`
              : 'Файл удалится из хранилища безвозвратно.'
        }
        onConfirm={async () => {
          const c = confirm
          setConfirm(null)
          if (c.kind === 'client') {
            const res = await run(() => removeClient(openId), 'Не удалось убрать клиента из архива')
            if (res?.ok) { setOpenId(null); closeClient() }
          } else if (c.kind === 'service') {
            await run(() => removeService(c.service.id), 'Не удалось удалить услугу')
          } else {
            await run(() => removeReport(c.report.id), 'Не удалось удалить отчёт')
          }
        }}
      />
    </PageSection>
  )
}

function ClientsGrid({ clients, loading, onOpen, canAdd, onAdd }) {
  if (loading && clients.length === 0) {
    return <div className="grid place-items-center py-14"><Spinner /></div>
  }
  if (clients.length === 0) {
    return (
      <EmptyState
        label="Архив пуст"
        text={canAdd
          ? 'Занесите клиента из базы, заведите услугу — и складывайте под неё отчёты.'
          : 'Здесь появятся клиенты вашего отдела, как только их занесёт руководитель.'}
        action={canAdd ? <Button variant="secondary" onClick={onAdd}>Клиент в архив</Button> : null}
      />
    )
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {clients.map((card) => (
        <ClientCard key={card.id} card={card} onOpen={() => onOpen(card.id)} />
      ))}
    </div>
  )
}

function ReportsList({ reports, total, loading, rights, onOpen, onDownload, onDelete, onMore }) {
  if (loading && reports.length === 0) {
    return <div className="grid place-items-center py-14"><Spinner /></div>
  }
  if (reports.length === 0) {
    return <EmptyState label="Ничего не нашлось" text="Попробуйте изменить фильтры или поискать по другому слову." />
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="caption">Найдено: {reportsWord(total)}</p>
      <div className="flex flex-col gap-1.5">
        {reports.map((report) => (
          <ReportRow
            key={report.id}
            report={report}
            showContext
            onOpen={() => onOpen(report)}
            onDownload={() => onDownload(report)}
            onDelete={() => onDelete(report)}
            canDelete={rights.canDeleteReport(report, report.service?.department?.id)}
          />
        ))}
      </div>
      {reports.length < total && (
        <div className="flex justify-center pt-1">
          <Button variant="secondary" onClick={onMore} loading={loading}>Показать ещё</Button>
        </div>
      )}
    </div>
  )
}
