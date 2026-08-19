import { useState } from 'react'
import {
  Button, Input, Textarea, Select, Checkbox, Form, FormRow, FormActions,
  Modal, ConfirmModal, Badge, Pill, Card, Avatar, AvatarStack, Spinner, EmptyState, Cosmos,
 } from '../../shared/ui'
import { PageSection } from '../../widgets'

export default function UiKitPage() {
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const users = [
    { id: 1, name: 'София К' }, { id: 2, name: 'Ян В' }, { id: 3, name: 'Мария Л' },
    { id: 4, name: 'Denis P' }, { id: 5, name: 'Оля Т' }, { id: 6, name: 'Kirill Z' },
  ]

  return (
    <div className="min-h-full">
      <Cosmos />
      <div className="mx-auto max-w-[1100px] px-5 py-10 flex flex-col gap-10">
        <PageSection pill="UI Kit" title="Shared-компоненты" subtitle="Витрина всего, что лежит в shared/ui. Каждый компонент управляется пропсами.">

          {}
          <Card>
            <p className="mono-caption mb-4">Button · variant / size / loading</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button loading>Loading</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </div>
          </Card>

          {}
          <Card>
            <p className="mono-caption mb-4">Form · Input / Select / Textarea / Checkbox</p>
            <Form onSubmit={(v) => alert(JSON.stringify(v, null, 2))}>
              <FormRow>
                <Input name="name" label="Название работы" placeholder="Например: сайт под ключ" required />
                <Select
                  name="client"
                  label="Клиент"
                  placeholder="Выберите клиента"
                  options={[
                    { value: 'hp', label: 'ХочуПлачу!' },
                    { value: 'polza', label: 'Polza.AI' },
                    { value: 'tradex', label: 'Tradex' },
                  ]}
                  required
                />
              </FormRow>
              <Input
                name="deadline"
                type="date"
                label="Срок"
                hint="Утром ставим срок на день"
              />
              <Input name="broken" label="Поле с ошибкой" error="Обязательное поле" placeholder="Пример состояния ошибки" />
              <Textarea name="details" label="Описание задачи" placeholder="Что нужно сделать..." />
              <Checkbox name="urgent" label="Срочная задача" />
              <FormActions>
                <Button variant="ghost" type="reset">Сбросить</Button>
                <Button type="submit">Создать</Button>
              </FormActions>
            </Form>
          </Card>

          {}
          <Card>
            <p className="mono-caption mb-4">Badge · tone / Pill</p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="ok">Готово</Badge>
              <Badge tone="warn">Срок прошёл</Badge>
              <Badge tone="danger">Просрочено</Badge>
              <Badge tone="brand">В процессе</Badge>
              <Badge tone="neutral">Черновик</Badge>
              <Pill>Отдел программирования</Pill>
            </div>
          </Card>

          {}
          <Card>
            <p className="mono-caption mb-4">Avatar · size / ring / AvatarStack</p>
            <div className="flex flex-wrap items-center gap-5">
              <Avatar name="София К" size={44} />
              <Avatar name="Ян В" size={36} ring />
              <Avatar name="?" size={28} />
              <AvatarStack users={users} max={4} />
              <Spinner size={20} />
            </div>
          </Card>

          {}
          <Card>
            <p className="mono-caption mb-4">Modal / ConfirmModal</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setModal(true)}>Открыть модалку</Button>
              <Button variant="danger" onClick={() => setConfirm(true)}>Открыть confirm</Button>
            </div>
          </Card>

          {}
          <Card pad="sm">
            <EmptyState label="Пусто" text="Так выглядит пустая колонка задач или отдел без сотрудников." action={<Button size="sm" variant="outline">Добавить</Button>} />
          </Card>
        </PageSection>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Новая работа"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Отмена</Button>
            <Button onClick={() => setModal(false)}>Сохранить</Button>
          </>
        }
      >
        <Form>
          <Input label="Клиент" placeholder="ХочуПлачу!" />
          <Textarea label="Работа" placeholder="Сайт: цепляющая главная" rows={3} />
        </Form>
      </Modal>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => setConfirm(false)}
        title="Уволить сотрудника?"
        text="Доступ в CRM будет закрыт сразу. Действие можно отменить только через админа."
        confirmText="Уволить"
        danger
      />
    </div>
  )
}
