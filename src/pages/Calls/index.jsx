import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../core/store/authStore'
import { useCallsStore } from '../../core/store/callsStore'
import { PageSection } from '../../widgets'
import { Button, ConfirmModal } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { DayColumn } from '../../components/calls/DayColumn'
import { CallModal } from '../../components/calls/CallModal'
import { CALLS_REFRESH_MS, callDayKey, callsScopeHint, todayKey, weekDays, weekLabel } from '../../utils/calls'

const MINE = 'mine'
const ALL = 'all'

export default function CallsPage() {
  const currentUser = useAuthStore((s) => s.user)
  const calls = useCallsStore((s) => s.calls)
  const allCalls = useCallsStore((s) => s.allCalls)
  const fetchCalls = useCallsStore((s) => s.fetchCalls)
  const fetchAllCalls = useCallsStore((s) => s.fetchAllCalls)
  const createCall = useCallsStore((s) => s.createCall)
  const editCall = useCallsStore((s) => s.editCall)
  const removeCall = useCallsStore((s) => s.removeCall)

  const isAdmin = currentUser?.role === 'admin'

  const [tab, setTab] = useState(MINE)
  const [weekOffset, setWeekOffset] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCall, setEditingCall] = useState(null)
  const [presetDay, setPresetDay] = useState(null)
  const [deletingCall, setDeletingCall] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  useEffect(() => {
    fetchCalls()
    if (isAdmin) fetchAllCalls()
    const timer = setInterval(() => {
      fetchCalls()
      if (isAdmin) fetchAllCalls()
    }, CALLS_REFRESH_MS)
    return () => clearInterval(timer)
  }, [fetchCalls, fetchAllCalls, isAdmin])

  const days = useMemo(() => weekDays(weekOffset), [weekOffset])
  const label = useMemo(() => weekLabel(weekOffset), [weekOffset])

  const source = isAdmin && tab === ALL ? allCalls : calls
  const groupByDept = isAdmin && tab === ALL

  // Раскладываем звонки по дням один раз на отрисовку, а не фильтруем
  // весь список в каждой из семи колонок.
  const byDay = useMemo(() => {
    const map = {}
    for (const c of source) {
      const key = callDayKey(c.scheduledAt)
      ;(map[key] ||= []).push(c)
    }
    return map
  }, [source])

  function groupsFor(dayKey) {
    const dayCalls = byDay[dayKey] || []
    if (!groupByDept) return [{ key: 'all', label: null, calls: dayCalls }]

    const byDept = new Map()
    for (const c of dayCalls) {
      // У админа своего отдела нет, его собственные звонки собираем
      // отдельной группой, иначе они молча потерялись бы при группировке.
      const id = c.department?.id || '__none__'
      const name = c.department?.name || 'Без отдела'
      if (!byDept.has(id)) byDept.set(id, { key: id, label: name, calls: [] })
      byDept.get(id).calls.push(c)
    }
    return [...byDept.values()].sort((a, b) => a.label.localeCompare(b.label, 'ru'))
  }

  function openCreate(dayKey) {
    setEditingCall(null)
    // Кнопка в шапке страницы не знает про конкретный день: на текущей
    // неделе логично предложить сегодня, на будущей — её понедельник.
    setPresetDay(dayKey || (weekOffset === 0 ? todayKey() : days[0].key))
    setModalOpen(true)
  }

  function openCall(call) {
    setEditingCall(call)
    setPresetDay(null)
    setModalOpen(true)
  }

  // Бэк проверяет права сам; здесь только прячем кнопки, которые всё
  // равно получили бы отказ. Главный отдела видит звонки лишь своего
  // отдела, поэтому отдельная сверка departmentId тут не нужна.
  const canManage = (call) =>
    !call ||
    call.ownerId === currentUser?.id ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'lead'

  async function confirmDelete() {
    if (!deletingCall) return
    setDeleteBusy(true)
    const res = await removeCall(deletingCall.id)
    setDeleteBusy(false)
    setDeletingCall(null)
    setModalOpen(false)
    if (!res.ok) window.alert(res.error || 'Не удалось удалить звонок')
  }

  return (
    <PageSection
      pill="Звонки"
      title="Звонки"
      subtitle={callsScopeHint(currentUser)}
      actions={<Button onClick={() => openCreate(null)}>+ Звонок</Button>}
    >
      {isAdmin && (
        <div className="flex gap-2 -mt-1">
          <ViewTab active={tab === MINE} onClick={() => setTab(MINE)}>Мой календарь</ViewTab>
          <ViewTab active={tab === ALL} onClick={() => setTab(ALL)}>Все звонки</ViewTab>
        </div>
      )}

      <div className="flex items-center gap-2">
        <WeekArrow onClick={() => setWeekOffset((w) => w - 1)} left label="Предыдущая неделя" />
        <p className="text-sm font-medium min-w-[9.5rem] text-center tabular-nums">{label}</p>
        <WeekArrow onClick={() => setWeekOffset((w) => w + 1)} label="Следующая неделя" />
        {weekOffset !== 0 && (
          <Button size="sm" variant="ghost" onClick={() => setWeekOffset(0)}>Эта неделя</Button>
        )}
      </div>

      <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {days.map((day) => (
          <DayColumn
            key={day.key}
            day={day}
            groups={groupsFor(day.key)}
            showOwner={groupByDept || currentUser?.role === 'lead'}
            onOpen={openCall}
            onAdd={openCreate}
          />
        ))}
      </div>

      {/* onDelete закрывает карточку до подтверждения: два модальных окна
          друг на друге спорят за блокировку прокрутки, и закрытие
          подтверждения вернуло бы скролл странице с открытой карточкой. */}
      <CallModal
        open={modalOpen}
        call={editingCall}
        presetDay={presetDay}
        canManage={canManage(editingCall)}
        onClose={() => setModalOpen(false)}
        onSubmit={(payload) =>
          editingCall
            ? editCall(editingCall.id, payload)
            : createCall(payload)
        }
        onDelete={(call) => { setModalOpen(false); setDeletingCall(call) }}
      />

      <ConfirmModal
        open={Boolean(deletingCall)}
        onClose={() => setDeletingCall(null)}
        onConfirm={confirmDelete}
        loading={deleteBusy}
        danger
        title="Удалить звонок?"
        confirmText="Удалить"
        text={deletingCall ? `«${deletingCall.title}» пропадёт без возможности отменить.` : ''}
      />
    </PageSection>
  )
}

function ViewTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap',
        active ? 'bg-accent text-white' : 'panel text-ink-3 hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function WeekArrow({ onClick, left, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="shrink-0 grid place-items-center w-8 h-8 rounded-full panel text-ink-3 hover:text-ink transition-colors cursor-pointer"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={left ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
      </svg>
    </button>
  )
}
