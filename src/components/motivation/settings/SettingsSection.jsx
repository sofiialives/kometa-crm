import { useEffect, useMemo, useState } from 'react'
import { Card, Spinner } from '../../../shared/ui'
import { useMotivationStore } from '../../../core/store/motivationStore'
import { ProfilesPanel } from './ProfilesPanel'
import { ProfileEditor } from './ProfileEditor'
import { AssignmentsPanel } from './AssignmentsPanel'
import { ScaleEditor } from './ScaleEditor'
import { WorkLevelsEditor } from './WorkLevelsEditor'
import { GeneralPanel } from './GeneralPanel'

/**
 * Раздел «Настройки» — только владелец (админ). Всё, что в задании отдано владельцу:
 * условия по отделам и их события, общая шкала премии, уровни работы,
 * лимиты и уведомления. Меняется без разработчика.
 */
export function SettingsSection() {
  const store = useMotivationStore()
  const { settings, settingsLoading, settingsError, fetchSettings } = store
  const [openProfileId, setOpenProfileId] = useState(null)

  useEffect(() => { fetchSettings() }, [fetchSettings])

  // Любое сохранение — перезапрос настроек: профиль, его события и даты
  // «условия обновлены» меняются вместе, проще взять их с сервера заново.
  const actions = useMemo(() => {
    const wrap = (fn) => async (...args) => {
      const res = await fn(...args)
      if (res.ok) await fetchSettings()
      return res
    }
    return {
      createProfile: wrap(store.createProfile),
      updateProfile: wrap(store.updateProfile),
      deleteProfile: wrap(store.deleteProfile),
      saveProfileScale: wrap(store.saveProfileScale),
      createEventType: wrap(store.createEventType),
      updateEventType: wrap(store.updateEventType),
      deleteEventType: wrap(store.deleteEventType),
      saveGlobalScale: wrap(store.saveGlobalScale),
      saveWorkLevels: wrap(store.saveWorkLevels),
      updateGeneral: wrap(store.updateGeneral),
      assignProfile: wrap(store.assignProfile),
    }
  }, [store, fetchSettings])

  if (settingsLoading && !settings) return <div className="grid place-items-center py-14"><Spinner /></div>
  if (settingsError && !settings) return <p className="text-sm text-danger">{settingsError}</p>
  if (!settings) return null

  const openProfile = settings.profiles.find((p) => p.id === openProfileId) || null

  return (
    <div className="flex flex-col gap-4">
      <ProfilesPanel profiles={settings.profiles} departments={settings.departments || []} onOpen={setOpenProfileId} actions={actions} />
      <AssignmentsPanel employees={settings.employees} profiles={settings.profiles} onAssign={actions.assignProfile} />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="caption">Общая шкала премии</p>
          <p className="text-sm text-ink-3">По ней считаются все профили, у которых нет своей шкалы.</p>
        </div>
        <ScaleEditor levels={settings.scale} onSave={actions.saveGlobalScale} />
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="caption">Уровни работы</p>
          <p className="text-sm text-ink-3">Оценка месяца словами. Денег к ней не привязано.</p>
        </div>
        <WorkLevelsEditor levels={settings.workLevels} onSave={actions.saveWorkLevels} />
      </Card>

      <GeneralPanel general={settings.general} onSave={actions.updateGeneral} />

      {openProfile && (
        <ProfileEditor
          profile={openProfile}
          globalScale={settings.scale}
          workLevels={settings.workLevels}
          onClose={() => setOpenProfileId(null)}
          actions={actions}
        />
      )}
    </div>
  )
}
