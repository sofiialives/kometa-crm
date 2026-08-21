import { useEffect, useRef, useState } from 'react'

const GIS_SRC = 'https://accounts.google.com/gsi/client?hl=ru'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      if (window.google) return resolve()
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1z" />
      <path fill="#34A853" d="M24 46c6 0 11-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.9-12.3-9.1H4.3v5.7C7.8 41 15.3 46 24 46z" />
      <path fill="#FBBC05" d="M11.7 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.3C2.8 17.1 2 20.4 2 24s.8 6.9 2.3 9.8l7.4-5.7z" />
      <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C35 4.2 30 2 24 2 15.3 2 7.8 7 4.3 14.2l7.4 5.7c1.7-5.2 6.6-9.1 12.3-9.1z" />
    </svg>
  )
}

/*
 * Кнопка входа через Google в стиле панели. Раньше сюда вставлялась
 * готовая кнопка Google: она приносила свою форму и свой фон, из-за чего
 * в тёмной теме вокруг неё оставалась светлая плашка, а форма логотипа
 * менялась вместе с темой — рядом с нашими кнопками это выглядело чужим.
 *
 * Поэтому рисуем свою кнопку, а настоящую кнопку Google кладём поверх
 * прозрачным слоем: клик достаётся ей, а видом управляем мы. Скрывать
 * её нельзя — иначе Google не отдаст токен.
 */
export function GoogleButton({ onCredential, disabled }) {
  const boxRef = useRef(null)
  const wrapRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false

    loadScript(GIS_SRC)
      .then(() => {
        if (cancelled || !window.google || !boxRef.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => onCredential(response.credential),
        })
        // Ширина у Google задаётся числом, поэтому подгоняем её под нашу
        // кнопку — иначе по краям клик уходит мимо.
        const px = Math.min(400, Math.max(200, width || wrapRef.current?.offsetWidth || 320))
        boxRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(boxRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'center',
          width: px,
          locale: 'ru',
        })
        setReady(true)
      })
      .catch(() => { if (!cancelled) setFailed(true) })

    return () => { cancelled = true }
  }, [onCredential, width])

  if (!CLIENT_ID) {
    return <p className="text-sm text-danger text-center">Не задан VITE_GOOGLE_CLIENT_ID</p>
  }

  if (failed) {
    return <p className="text-sm text-ink-3 text-center">Вход через Google сейчас недоступен</p>
  }

  return (
    <div ref={wrapRef} className="relative h-11 w-full">
      {/* Видимая кнопка: наш стиль, наши цвета. Клики пропускает насквозь. */}
      <div
        aria-hidden="true"
        className={[
          'pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5',
          'rounded-[8px] border border-line-2 bg-panel text-sm font-semibold text-ink',
          'transition-colors duration-150',
          ready ? 'opacity-100' : 'opacity-60',
        ].join(' ')}
      >
        <GoogleMark />
        Вход с аккаунтом Google
      </div>

      {/* Настоящая кнопка Google — прозрачная, но кликабельная. */}
      <div
        ref={boxRef}
        className={[
          'absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.001]',
          disabled ? 'pointer-events-none' : 'cursor-pointer',
        ].join(' ')}
      />
    </div>
  )
}
