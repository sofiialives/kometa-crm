import { useEffect, useMemo, useState } from 'react'
import { Card, Spinner } from '../../../shared/ui'
import { useMotivationStore } from '../../../core/store/motivationStore'
import { ProfilesPanel } from './ProfilesPanel'
import { ProfileEditor } from './ProfileEditor'
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
  // { departmentId, key: 'staff' | 'lead' | 'u:<id>' } или { profileId } для старых профилей
  const [opened, setOpened] = useState(null)

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
    }
  }, [store, fetchSettings])

  if (settingsLoading && !settings) return <div className="grid place-items-center py-14"><Spinner /></div>
  if (settingsError && !settings) return <p className="text-sm text-danger">{settingsError}</p>
  if (!settings) return null

  return (
    <div className="flex flex-col gap-4">
      <ProfilesPanel profiles={settings.profiles} departments={settings.departments || []} employees={settings.employees || []} onOpen={setOpened} actions={actions} />

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

      {/* Отдел окна пропал из настроек (удалили, переименовали) — окно не открываем с пустым отделом. */}
      {opened && (!opened.departmentId || (settings.departments || []).some((d) => d.id === opened.departmentId)) && (
        <ProfileEditor
          opened={opened}
          profiles={settings.profiles}
          department={(settings.departments || []).find((d) => d.id === opened.departmentId) || null}
          employees={settings.employees || []}
          globalScale={settings.scale}
          workLevels={settings.workLevels}
          onClose={() => setOpened(null)}
          actions={actions}
        />
      )}
    </div>
  )
}
