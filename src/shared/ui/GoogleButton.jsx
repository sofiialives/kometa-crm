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

export function GoogleButton({ onCredential, disabled }) {
  const boxRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false
    loadScript(GIS_SRC).then(() => {
      if (cancelled || !window.google || !boxRef.current) return
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => onCredential(response.credential),
      })
      window.google.accounts.id.renderButton(boxRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        width: 320,
        text: 'continue_with',
        locale: 'ru',
      })
      setReady(true)
    })
    return () => { cancelled = true }
  }, [onCredential])

  if (!CLIENT_ID) {
    return <p className="text-sm text-danger text-center">Не задан VITE_GOOGLE_CLIENT_ID</p>
  }

  return (
    <div className="min-h-12 flex items-center justify-center">
      <div ref={boxRef} className={disabled ? 'pointer-events-none opacity-70' : ''} />
      {!ready && (
        <span
          className="w-5 h-5 rounded-full border-2 border-line border-t-brand-light animate-spin"
          aria-label="Загрузка кнопки Google"
        />
      )}
    </div>
  )
}