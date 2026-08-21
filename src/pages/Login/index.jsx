import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../core/store/authStore'
import { Card, Input, PasswordInput, Button, Form, Pill, GoogleButton } from '../../shared/ui'

const VIEW = {
  LOGIN: 'login',
  FORGOT_EMAIL: 'forgot-email',
  FORGOT_RESET: 'forgot-reset',
}

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle)
  const forgotPassword = useAuthStore((s) => s.forgotPassword)
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const loading = useAuthStore((s) => s.loading)

  const [view, setView] = useState(VIEW.LOGIN)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [resetEmail, setResetEmail] = useState('')

  const navigate = useNavigate()
  const location = useLocation()

  function goToApp() {
    navigate(location.state?.from?.pathname || '/', { replace: true })
  }

  async function onSubmitLogin(values) {
    setError(null)
    const res = await login(values)
    if (res.ok) goToApp()
    else setError(res.error)
  }

  async function onGoogleCredential(idToken) {
    setError(null)
    const res = await loginWithGoogle(idToken)
    if (res.ok) goToApp()
    else setError(res.error)
  }

  async function onSubmitForgotEmail(values) {
    setError(null)
    const res = await forgotPassword(values.email)
    if (res.ok) {
      setResetEmail(values.email)
      setNotice('Если почта известна системе, код отправлен. Он действует 10 минут.')
      setView(VIEW.FORGOT_RESET)
    } else {
      setError(res.error)
    }
  }

  async function onSubmitReset(values) {
    setError(null)
    const res = await resetPassword({ email: resetEmail, code: values.code, newPassword: values.newPassword })
    if (res.ok) goToApp()
    else setError(res.error)
  }

  return (
    <div className="min-h-full grid place-items-center p-4">
      <Card pad="lg" className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Pill>KOMETA · CRM</Pill>
          <h1 className="text-2xl font-bold tracking-tight">{titleFor(view)}</h1>
          {view === VIEW.LOGIN && (
            <p className="text-sm text-ink-3 leading-relaxed">
              Если входите впервые, пароль, который введёте здесь, станет постоянным.
            </p>
          )}
        </div>

        {notice && view !== VIEW.LOGIN && (
          <p className="text-sm text-accent bg-accent/10 border border-accent/30 rounded-xl px-3.5 py-2.5 leading-relaxed">
            {notice}
          </p>
        )}

        {view === VIEW.LOGIN && (
          <>
            <Form onSubmit={onSubmitLogin}>
              <Input name="email" type="email" label="Email" placeholder="you@kometa.web3" required autoFocus />
              <div className="flex flex-col gap-1.5">
                <PasswordInput name="password" label="Пароль" placeholder="••••••••" required error={error} />
                <button
                  type="button"
                  onClick={() => { setError(null); setNotice(null); setView(VIEW.FORGOT_EMAIL) }}
                  className="self-end text-xs text-ink-3 hover:text-accent transition-colors cursor-pointer"
                >
                  Забыли пароль?
                </button>
              </div>
              <Button type="submit" size="lg" full loading={loading}>Войти</Button>
            </Form>

            <div className="flex items-center gap-3 -my-1">
              <span className="h-px flex-1 bg-line" />
              <span className="caption">или</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <GoogleButton onCredential={onGoogleCredential} disabled={loading} />

            <p className="caption text-center">Доступ выдаёт администратор</p>
          </>
        )}

        {view === VIEW.FORGOT_EMAIL && (
          <Form onSubmit={onSubmitForgotEmail}>
            <Input name="email" type="email" label="Email" placeholder="you@kometa.web3" required autoFocus error={error} />
            <Button type="submit" size="lg" full loading={loading}>Отправить код</Button>
            <BackToLogin onClick={() => { setError(null); setView(VIEW.LOGIN) }} />
          </Form>
        )}

        {view === VIEW.FORGOT_RESET && (
          <Form onSubmit={onSubmitReset}>
            <Input
              name="code"
              label="Код из письма"
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
            />
            <PasswordInput name="newPassword" label="Новый пароль" placeholder="••••••••" required error={error} />
            <Button type="submit" size="lg" full loading={loading}>Сохранить пароль</Button>
            <BackToLogin onClick={() => { setError(null); setView(VIEW.LOGIN) }} />
          </Form>
        )}
      </Card>
    </div>
  )
}

function BackToLogin({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-center text-xs text-ink-3 hover:text-accent transition-colors cursor-pointer -mt-1"
    >
      ← Назад ко входу
    </button>
  )
}

function titleFor(view) {
  if (view === VIEW.FORGOT_EMAIL) return 'Восстановление пароля'
  if (view === VIEW.FORGOT_RESET) return 'Введите код'
  return 'Вход в панель'
}
