import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const THEMES = [
  { value: 'system', label: 'Как в системе' },
  { value: 'dark', label: 'Тёмная' },
  { value: 'light', label: 'Светлая' },
]

// «Системная» не пишет атрибут вообще: тогда работает медиазапрос
// prefers-color-scheme в index.css. Явный выбор ставит data-theme и
// перебивает систему в обе стороны.
function apply(theme) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'system',
      setTheme(theme) {
        apply(theme)
        set({ theme })
      },
    }),
    {
      name: 'kometa-crm-theme',
      onRehydrateStorage: () => (state) => apply(state?.theme || 'system'),
    },
  ),
)
