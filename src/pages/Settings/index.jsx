import { useRef, useState } from 'react'
import { useAuthStore } from '../../core/store/authStore'
import { PageSection } from '../../widgets'
import { Card, Avatar, Button, Input, PasswordInput } from '../../shared/ui'
import { compressImageToDataUrl } from '../../utils/image'
import { roleLabel } from '../../shared/layout/Header'

const AVATAR_COLORS = [
  null, // null = вернуться к фирменному градиенту
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
]

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <PageSection pill="Настройки" title="Настройки профиля" subtitle="Видно всей команде — в списках, задачах, отделах.">
      <div className="grid gap-4 lg:grid-cols-[360px_1fr] lg:items-start">
        <Card pad="md" className="flex flex-col items-center gap-3 text-center">
          <Avatar name={user?.name} src={user?.avatarUrl} color={user?.avatarColor} size={96} />
          <div>
            <p className="font-medium">{user?.name}</p>
            <p className="mono-caption">{roleLabel(user?.role)}{user?.position ? ' · ' + user.position : ''}</p>
            <p className="mt-1 text-[13px] text-ink-3">{user?.email}</p>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <ProfileForm />
          <PasswordForm />
        </div>
      </div>
    </PageSection>
  )
}

function ProfileForm() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const fileRef = useRef(null)

  async function saveName(e) {
    e.preventDefault()
    if (name.trim().length < 2) return setError('Введите имя полностью')
    setSaving(true)
    setError(null)
    const res = await updateProfile({ name: name.trim() })
    setSaving(false)
    if (res.ok) { setNotice('Имя сохранено'); setTimeout(() => setNotice(null), 2000) }
    else setError(res.error)
  }

  async function pickColor(color) {
    setError(null)
    // Цвет виден только на кружке без фото — выбор цвета явно убирает
    // текущую картинку (включая гугловскую), иначе Avatar всё равно
    // нарисует src поверх любого цвета и ничего не изменится на вид.
    const res = await updateProfile({ avatarColor: color, avatarUrl: null })
    if (!res.ok) setError(res.error)
  }

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const dataUrl = await compressImageToDataUrl(file)
      const res = await updateProfile({ avatarUrl: dataUrl })
      if (!res.ok) setError(res.error)
    } catch (err) {
      setError(err.message)
    }
    setUploading(false)
  }

  async function removePhoto() {
    setError(null)
    const res = await updateProfile({ avatarUrl: null })
    if (!res.ok) setError(res.error)
  }

  return (
    <Card pad="md" className="flex flex-col gap-5">
      <p className="font-semibold">Профиль</p>

      <form onSubmit={saveName} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          label="Имя и фамилия"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null) }}
          className="flex-1"
        />
        <Button type="submit" loading={saving}>Сохранить</Button>
      </form>

      <div>
        <p className="mono-caption mb-2">Фото</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
            Загрузить фото
          </Button>
          {user?.avatarUrl && (
            <Button variant="ghost" size="sm" onClick={removePhoto}>Убрать фото</Button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
      </div>

      <div>
        <p className="mono-caption mb-2">Цвет кружка, пока нет фото</p>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c || 'default'}
              onClick={() => pickColor(c)}
              title={c || 'Фирменный градиент'}
              className={`h-8 w-8 rounded-full border-2 transition-transform cursor-pointer hover:scale-110 ${
                user?.avatarColor === c ? 'border-white' : 'border-transparent'
              }`}
              style={{ background: c || 'linear-gradient(135deg, var(--color-brand-blue), var(--color-brand-purple))' }}
            />
          ))}
        </div>
      </div>

      {notice && <p className="text-[13px] text-ok">{notice}</p>}
      {error && <p className="text-[13px] text-danger">{error}</p>}
    </Card>
  )
}

function PasswordForm() {
  const changePassword = useAuthStore((s) => s.changePassword)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 4) return setError('Пароль слишком короткий')
    if (newPassword !== confirm) return setError('Пароли не совпадают')

    setSaving(true)
    const res = await changePassword({ currentPassword, newPassword })
    setSaving(false)
    if (res.ok) {
      setCurrentPassword(''); setNewPassword(''); setConfirm('')
      setNotice('Пароль изменён')
      setTimeout(() => setNotice(null), 2000)
    } else {
      setError(res.error)
    }
  }

  return (
    <Card pad="md" className="flex flex-col gap-4">
      <p className="font-semibold">Пароль</p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <PasswordInput
          label="Текущий пароль"
          hint="Оставьте пустым, если входили только через Google"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <PasswordInput
          label="Новый пароль"
          required
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setError(null) }}
        />
        <PasswordInput
          label="Повторите новый пароль"
          required
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(null) }}
        />
        {notice && <p className="text-[13px] text-ok">{notice}</p>}
        {error && <p className="text-[13px] text-danger">{error}</p>}
        <Button type="submit" loading={saving} className="self-start">Сменить пароль</Button>
      </form>
    </Card>
  )
}
