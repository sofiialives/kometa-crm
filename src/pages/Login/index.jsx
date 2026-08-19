import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../core/store/authStore'
import { Card, Input, Button, Form, Pill, Cosmos } from '../../shared/ui'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const loading = useAuthStore((s) => s.loading)
  const [gLoading, setGLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  async function onGoogle() {
    setError(null)
    setGLoading(true)
    const res = await loginWithGoogle()
    setGLoading(false)
    if (res.ok) navigate(location.state?.from?.pathname || '/', { replace: true })
    else setError(res.error)
  }

  async function onSubmit(values) {
    setError(null)
    const res = await login(values)
    if (res.ok) navigate(location.state?.from?.pathname || '/', { replace: true })
    else setError(res.error)
  }

  return (
    <div className="min-h-full grid place-items-center p-4">
      <Cosmos />
      <Card pad="lg" className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Pill>KOMETA · CRM</Pill>
          <h1 className="text-2xl font-bold tracking-tight">Вход в панель</h1>
        </div>
        <Form onSubmit={onSubmit}>
          <Input name="email" type="email" label="Email" placeholder="you@kometa.web3" required autoFocus />
          <Input name="password" type="password" label="Пароль" placeholder="••••••••" required error={error} />
          <Button type="submit" size="lg" full loading={loading}>Войти</Button>
        </Form>
        <div className="flex items-center gap-3 -my-1">
          <span className="h-px flex-1 bg-white/10" />
          <span className="mono-caption">или</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <Button variant="secondary" size="lg" full loading={gLoading} onClick={onGoogle}>
          <GoogleIcon />
          Войти через Google
        </Button>
        <p className="mono-caption text-center">Доступ выдаёт администратор</p>
      </Card>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.66l3.13-3.13C17.45 1.77 14.97.75 12 .75 7.7.75 3.99 3.22 2.18 6.82l3.66 2.84C6.7 7.05 9.13 5.04 12 5.04z"/>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.28H12v4.51h6.45c-.28 1.48-1.12 2.73-2.38 3.58l3.6 2.79c2.1-1.95 3.82-4.81 3.82-8.6z"/>
      <path fill="#FBBC05" d="M5.84 14.34a7.03 7.03 0 0 1 0-4.68L2.18 6.82a11.26 11.26 0 0 0 0 10.36l3.66-2.84z"/>
      <path fill="#34A853" d="M12 23.25c3.04 0 5.6-1 7.46-2.72l-3.6-2.79c-1 .68-2.3 1.08-3.86 1.08-2.87 0-5.3-2.01-6.16-4.62l-3.66 2.84c1.81 3.6 5.52 6.21 9.82 6.21z"/>
    </svg>
  )
}
