import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '../../core/store/authStore'
import { useCallsStore } from '../../core/store/callsStore'
import { useDepartmentsStore } from '../../core/store/departmentsStore'
import { PageSection } from '../../widgets'
import { Button, ConfirmModal } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'
import { DeptTabs } from '../../components/tasks/DeptTabs'
import { DayColumn } from '../../components/calls/DayColumn'
import { CallModal } from '../../components/calls/CallModal'
import { CALLS_REFRESH_MS, callDayKey, callsScopeHint, todayKey, weekDays, weekLabel } from '../../utils/calls'

// Дальше следующей недели не листаем: звонки планируют на ближайшие дни,
// а прошедшие всё равно удаляются ночью, и назад смотреть не на что.
const MAX_WEEK_AHEAD = 1

const MINE = 'mine'
const ALL = 'all'

/**
 * Отделы звонка — все, чьи люди в нём заняты: отдел организатора плюс
 * отделы участников. Созвон дизайнера с разработчиком поэтому лежит
 * сразу в двух вкладках, а не только у того, кто его завёл.
 */
function departmentsOf(call) {
  const ids = new Set()
  if (call.owner?.departmentId) ids.add(call.owner.departmentId)
  else if (call.departmentId) ids.add(call.departmentId)
  for (const p of call.participants || []) if (p.departmentId) ids.add(p.departmentId)
  return ids
}

export default function CallsPage() {
  const currentUser = useAuthStore((s) => s.user)
  const calls = useCallsStore((s) => s.calls)
  const allCalls = useCallsStore((s) => s.allCalls)
  const directory = useCallsStore((s) => s.directory)
  const fetchCalls = useCallsStore((s) => s.fetchCalls)
  const fetchAllCalls = useCallsStore((s) => s.fetchAllCalls)
  const fetchDirectory = useCallsStore((s) => s.fetchDirectory)
  const createCall = useCallsStore((s) => s.createCall)
  const editCall = useCallsStore((s) => s.editCall)
  const removeCall = useCallsStore((s) => s.removeCall)

  const departments = useDepartmentsStore((s) => s.departments)
  const fetchDepartments = useDepartmentsStore((s) => s.fetchDepartments)

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
    fetchDirectory()
    if (isAdmin) {
      fetchAllCalls()
      fetchDepartments()
    }
    const timer = setInterval(() => {
      fetchCalls()
      if (isAdmin) fetchAllCalls()
    }, CALLS_REFRESH_MS)
    return () => clearInterval(timer)
  }, [fetchCalls, fetchAllCalls, fetchDirectory, fetchDepartments, isAdmin])

  const days = useMemo(() => weekDays(weekOffset), [weekOffset])
  const label = useMemo(() => weekLabel(weekOffset), [weekOffset])

  const tabs = useMemo(
    () => (isAdmin ? [{ id: MINE, name: 'Мои звонки' }, ...departments, { id: ALL, name: 'Все звонки' }] : []),
    [isAdmin, departments],
  )

  // Вкладки отделов и «Все звонки» берутся из одного уже загруженного
  // списка: данных немного, а переключение так происходит мгновенно и без
  // запроса на каждый клик.
  const source = useMemo(() => {
    if (!isAdmin || tab === MINE) return calls
    if (tab === ALL) return allCalls
    return allCalls.filter((c) => departmentsOf(c).has(tab))
  }, [isAdmin, tab, calls, allCalls])

  const groupByDept = isAdmin && tab === ALL

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
    const put = (id, name, call) => {
      if (!byDept.has(id)) byDept.set(id, { key: id, label: name, calls: [] })
      byDept.get(id).calls.push(call)
    }

    for (const c of dayCalls) {
      const ids = departmentsOf(c)
      if (ids.size === 0) {
        // У админа своего отдела нет — его звонки собираем отдельно,
        // иначе они молча потерялись бы при группировке.
        put('__none__', 'Без отдела', c)
        continue
      }
      // Один звонок попадает в каждый задействованный отдел: так просили,
      // чтобы созвон дизайнера с разработчиком был виден обоим отделам.
      for (const id of ids) {
        put(id, departments.find((d) => d.id === id)?.name || 'Отдел', c)
      }
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

  const author = useMemo(() => {
    const own = calls.find((c) => c.ownerId === currentUser?.id && c.department?.name)
    return {
      id: currentUser?.id,
      name: currentUser?.name,
      avatarUrl: currentUser?.avatarUrl,
      avatarColor: currentUser?.avatarColor,
      department: own?.department?.name || null,
    }
  }, [calls, currentUser])

  // Менять звонок может только тот, кто его поставил: он в контакте с
  // клиентом. Бэк проверяет это сам, здесь лишь прячем кнопки, которые
  // всё равно получили бы отказ.
  const canManage = (call) => !call || call.ownerId === currentUser?.id

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
      {isAdmin && <DeptTabs departments={tabs} active={tab} onSelect={setTab} />}

      <div className="flex items-center gap-2">
        <WeekArrow
          left
          label="Предыдущая неделя"
          disabled={weekOffset <= 0}
          onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
        />
        <p className="text-sm font-medium min-w-[9.5rem] text-center tabular-nums">{label}</p>
        <WeekArrow
          label="Следующая неделя"
          disabled={weekOffset >= MAX_WEEK_AHEAD}
          onClick={() => setWeekOffset((w) => Math.min(MAX_WEEK_AHEAD, w + 1))}
        />
        {weekOffset !== 0 && (
          <Button size="sm" variant="ghost" onClick={() => setWeekOffset(0)}>Эта неделя</Button>
        )}
      </div>

      {/* Колонкам задан жёсткий минимум ширины: при добавлении звонков они
          больше не сжимаются, а неделя уезжает в горизонтальную прокрутку.
          На широком экране 1098px влезают целиком, и прокрутки нет вовсе.
          На телефоне семь колонок в ряд нечитаемы — там дни идут стопкой. */}
      <div className="sm:overflow-x-auto sm:pb-1">
        <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-7 sm:gap-2 sm:min-w-[1098px]">
          {days.map((day) => (
            <DayColumn
              key={day.key}
              day={day}
              groups={groupsFor(day.key)}
              count={(byDay[day.key] || []).length}
              showOwner={isAdmin ? tab !== MINE : currentUser?.role === 'lead'}
              onOpen={openCall}
              onAdd={openCreate}
            />
          ))}
        </div>
      </div>

      {/* onDelete закрывает карточку до подтверждения: два модальных окна
          друг на друге спорят за блокировку прокрутки, и закрытие
          подтверждения вернуло бы скролл странице с открытой карточкой. */}
      <CallModal
        open={modalOpen}
        call={editingCall}
        presetDay={presetDay}
        canManage={canManage(editingCall)}
        author={author}
        directory={directory}
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
        text={deletingCall ? `«${deletingCall.title}» пропадёт у всех участников, отменить будет нельзя.` : ''}
      />
    </PageSection>
  )
}

function WeekArrow({ onClick, left, label, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx(
        'shrink-0 grid place-items-center w-8 h-8 rounded-full panel transition-colors',
        disabled ? 'text-ink-3/35 cursor-default' : 'text-ink-3 hover:text-ink cursor-pointer',
      )}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={left ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
      </svg>
    </button>
  )
}
