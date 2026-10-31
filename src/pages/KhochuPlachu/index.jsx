import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../core/store/authStore'
import { useDepartmentsStore } from '../../core/store/departmentsStore'
import { useKhochuPlachuStore } from '../../core/store/khochuPlachuStore'
import { PageSection } from '../../widgets'
import { Button, ConfirmModal, EmptyState, Input, Select, Spinner } from '../../shared/ui'
import { AddAmbassadorModal } from '../../components/khochuPlachu/AddAmbassadorModal'
import { AmbassadorCard } from '../../components/khochuPlachu/AmbassadorCard'
import { AmbassadorDetailModal } from '../../components/khochuPlachu/AmbassadorDetailModal'
import { AnalyticsPanel } from '../../components/khochuPlachu/AnalyticsPanel'

const DEPARTMENT_NAME = 'Хочу Плачу фокус'
const ACCOUNT_MANAGER_POSITION = 'Аккаунт менеджер'

export default function KhochuPlachuPage() {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const departments = useDepartmentsStore((s) => s.departments)
  const fetchDepartments = useDepartmentsStore((s) => s.fetchDepartments)
  const department = departments.find((d) => d.id === user?.departmentId)
  const isAccountManager = !isAdmin && department?.name === DEPARTMENT_NAME && user?.position === ACCOUNT_MANAGER_POSITION
  const isManager = !isAdmin && department?.name === DEPARTMENT_NAME && !isAccountManager

  const {
    ambassadors, themes, analytics, loading,
    fetchAmbassadors, fetchThemes, createAmbassador, decideAmbassador, removeFromApproved,
    fetchAnalytics, markNotificationsRead,
  } = useKhochuPlachuStore()

  const [q, setQ] = useState('')
  const [theme, setTheme] = useState('')
  const [status, setStatus] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [detail, setDetail] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (departments.length === 0) fetchDepartments() }, [departments.length, fetchDepartments])
  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])
  useEffect(() => { fetchThemes() }, [fetchThemes])
  useEffect(() => { if (isAccountManager) markNotificationsRead() }, [isAccountManager, markNotificationsRead])

  const debounced = useDebounced(q, 300)
  useEffect(() => {
    fetchAmbassadors({ q: debounced, theme, status })
  }, [fetchAmbassadors, debounced, theme, status])

  const statusOptions = useMemo(() => {
    if (isAdmin) return [{ value: 'approved', label: 'Одобрены' }]
    return [
      { value: '', label: 'Все статусы' },
      { value: 'pending', label: 'На рассмотрении' },
      { value: 'approved', label: 'Одобрены' },
      { value: 'removed', label: 'Снятые' },
    ]
  }, [isAdmin])

  async function refresh() {
    await fetchAmbassadors({ q: debounced, theme, status })
    fetchAnalytics()
  }

  async function run(action, failMessage) {
    setBusy(true)
    const res = await action()
    setBusy(false)
    if (res?.ok) await refresh()
    else window.alert(res?.error || failMessage)
    return res
  }

  return (
    <PageSection
      pill="Хочу Плачу!"
      title="Амбассадоры"
      subtitle="Заявки на амбассадоров, их проверка и статистика по отделу."
      actions={isManager && <Button onClick={() => setAddOpen(true)}>Добавить амбассадора</Button>}
    >
      <AnalyticsPanel analytics={analytics} />

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Поиск по тематике, условиям, контакту…" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 min-w-[220px]" />
        <Select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="Все тематики"
          options={themes.map((t) => ({ value: t, label: t }))}
          className="w-52"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} options={statusOptions} className="w-52" />
      </div>

      {loading && ambassadors.length === 0 ? (
        <div className="grid place-items-center py-14"><Spinner /></div>
      ) : ambassadors.length === 0 ? (
        <EmptyState label="Пока пусто" text="Здесь появятся заявки на амбассадоров." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ambassadors.map((a) => (
            <AmbassadorCard
              key={a.id}
              ambassador={a}
              canDecide={isAccountManager && a.status === 'pending'}
              canRemove={isAccountManager && a.status === 'approved'}
              onOpen={(amb) => setDetail(amb)}
              onApprove={(amb) => setConfirm({ kind: 'approved', ambassador: amb })}
              onReject={(amb) => setConfirm({ kind: 'rejected', ambassador: amb })}
              onRemove={(amb) => setConfirm({ kind: 'remove', ambassador: amb })}
            />
          ))}
        </div>
      )}

      <AmbassadorDetailModal ambassador={detail} onClose={() => setDetail(null)} />

      <AddAmbassadorModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(payload, files) => run(() => createAmbassador(payload, files), 'Не удалось добавить амбассадора')}
        themes={themes}
      />

      <ConfirmModal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        loading={busy}
        danger={confirm?.kind !== 'approved'}
        title={
          confirm?.kind === 'approved' ? 'Одобрить амбассадора?'
            : confirm?.kind === 'rejected' ? 'Отклонить амбассадора?'
              : 'Снять с одобренных?'
        }
        confirmText={confirm?.kind === 'approved' ? 'Одобрить' : confirm?.kind === 'rejected' ? 'Отклонить' : 'Снять'}
        text={
          confirm?.kind === 'remove'
            ? 'Амбассадор перестанет быть виден как одобренный.'
            : 'Менеджер получит уведомление в Telegram о решении.'
        }
        onConfirm={async () => {
          const c = confirm
          setConfirm(null)
          if (c.kind === 'remove') await run(() => removeFromApproved(c.ambassador.id), 'Не удалось снять с одобренных')
          else await run(() => decideAmbassador(c.ambassador.id, c.kind), 'Не удалось сохранить решение')
        }}
      />
    </PageSection>
  )
}

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
