import { useEffect, useRef } from 'react'

/**
 * Свежие данные без перезагрузки страницы: callback раз в interval, пока
 * вкладка браузера видна, и сразу, когда на неё вернулись. Открытые окна и
 * выбранные фильтры не сбрасываются: перезапрашиваются только данные.
 */
export function useAutoRefresh(callback, interval = 30000) {
  const ref = useRef(callback)
  ref.current = callback
  useEffect(() => {
    const run = () => { if (document.visibilityState === 'visible') ref.current() }
    const id = setInterval(run, interval)
    document.addEventListener('visibilitychange', run)
    window.addEventListener('focus', run)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', run)
      window.removeEventListener('focus', run)
    }
  }, [interval])
}
