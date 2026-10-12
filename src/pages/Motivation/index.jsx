import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageSection } from '../../widgets'
import { Spinner } from '../../shared/ui'
import { useAuthStore } from '../../core/store/authStore'
import { useMotivationStore } from '../../core/store/motivationStore'
import { SectionTabs } from '../../components/motivation/SectionTabs'
import { MotivationView } from '../../components/motivation/MotivationView'
import { ConditionsView } from '../../components/motivation/ConditionsView'
import { MonthSelect } from '../../components/motivation/MonthSelect'
import { TeamSection } from '../../components/motivation/TeamSection'
import { SettingsSection } from '../../components/motivation/settings/SettingsSection'

/**
 * Вкладка «Мотивация».
 *
 * У сотрудника два раздела: «Моя мотивация» и «Мои условия». У руководителя
 * — «Команда»: банка и баллов у него самого нет, так решил заказчик. У
 * админа к «Команде» добавляются «Настройки».
 *
 * Раздел и месяц живут в адресной строке: ссылку на «команду за октябрь»
 * можно отложить или отправить себе же.
 */

const SECTIONS = {
  staff: [
    { id: 'my', label: 'Моя мотивация' },
    { id: 'conditions', label: 'Мои условия' },
  ],
  lead: [{ id: 'team', label: 'Команда' }],
  admin: [
    { id: 'team', label: 'Команда' },
    { id: 'settings', label: 'Настройки' },
  ],
}

const SUBTITLES = {
  my: 'Сколько лежит в вашем банке, какую часть вы уже заработали и какой у вас уровень работы.',
  conditions: 'За что вы получаете и теряете баллы — правила для вашей должности.',
  team: 'Банки, баллы и уровни сотрудников. Здесь же пополняется банк и ставятся баллы.',
  settings: 'Профили должностей, шкалы, уровни и назначение профилей. Меняется без разработчика.',
}

export default function MotivationPage() {
  const role = useAuthStore((s) => s.user?.role) || 'staff'
  const sections = SECTIONS[role] || SECTIONS.staff

  const [params, setParams] = useSearchParams()
  const requested = params.get('section')
  const section = sections.some((s) => s.id === requested) ? requested : sections[0].id
  const month = params.get('month') || ''

  const setParam = useCallback((key, value) => {
    setParams((prev) => {
      const p = new URLSearchParams(prev)
      if (value) p.set(key, value); else p.delete(key)
      return p
    }, { replace: true })
  }, [setParams])

  return (
    <PageSection pill="Мотивация сотрудников" title="Мотивация" subtitle={SUBTITLES[section]}>
      <SectionTabs sections={sections} value={section} onChange={(id) => setParam('section', id)} />

      {section === 'my' && <MySection month={month} onMonthChange={(m) => setParam('month', m)} />}
      {section === 'conditions' && <MyConditions />}
      {section === 'team' && <TeamSection month={month} onMonthChange={(m) => setParam('month', m)} />}
      {section === 'settings' && <SettingsSection />}
    </PageSection>
  )
}

/**
 * «Моя мотивация». Новое (пополнения, баллы) подсвечивается при входе, а
 * через пару секунд сервер запоминает, что человек это увидел: до агента
 * это и есть уведомление о пополнении, поэтому гасить его сразу нельзя.
 */
function MySection({ month, onMonthChange }) {
  const { mine, mineLoading, mineError, fetchMine, markSeen } = useMotivationStore()
  const marked = useRef(false)

  useEffect(() => { fetchMine(month || undefined) }, [fetchMine, month])

  const hasNew = Boolean(mine?.unseen && (mine.unseen.bankCents > 0 || mine.unseen.events > 0))

  useEffect(() => {
    if (!hasNew || marked.current || !mine) return undefined
    // Отмечаем просмотренным ровно то, что было на экране: время самой
    // свежей записи из этого ответа, а не «сейчас».
    const newest = (list) => list.reduce((max, e) => (!max || e.createdAt > max ? e.createdAt : max), null)
    const until = { bankUntil: newest(mine.bank.history), eventsUntil: newest(mine.history) }
    const t = setTimeout(() => { marked.current = true; markSeen(until) }, 2500)
    return () => clearTimeout(t)
  }, [hasNew, markSeen, mine])

  if (mineLoading && !mine) return <div className="grid place-items-center py-14"><Spinner /></div>
  if (mineError && !mine) return <p className="text-sm text-danger">{mineError}</p>
  if (!mine) return null

  return (
    <div className="flex flex-col gap-4">
      {/* Ошибка видна и поверх старых данных: иначе неудачный запрос
          оставлял бы на экране прошлый месяц как ни в чём не бывало. */}
      {mineError && <p className="text-sm text-danger">{mineError}</p>}
      <MonthSelect months={mine.months} current={mine.currentMonth} value={mine.month} onChange={onMonthChange} className="w-60" />
      <MotivationView data={mine} highlight={hasNew && mine.unseen.bankCents > 0} />
    </div>
  )
}

function MyConditions() {
  const { conditions, conditionsLoading, conditionsError, fetchConditions } = useMotivationStore()
  useEffect(() => { fetchConditions() }, [fetchConditions])

  if (conditionsLoading && !conditions) return <div className="grid place-items-center py-14"><Spinner /></div>
  if (conditionsError && !conditions) return <p className="text-sm text-danger">{conditionsError}</p>
  if (!conditions) return null
  return (
    <div className="flex flex-col gap-4">
      {conditionsError && <p className="text-sm text-danger">{conditionsError}</p>}
      <ConditionsView data={conditions} />
    </div>
  )
}
