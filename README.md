# KOMETA CRM

Внутренняя CRM-панель агентства. Стек: **React 18 + Vite + Tailwind v4 + React Router 6 + Zustand**.

## Быстрый старт

```
npm install
npm run dev      # dev-сервер
npm run build    # прод-сборка в dist/
npm run preview  # локальный просмотр сборки
```

Node 18+. Entry: `src/index.jsx` (Vite), не `index.js`.

## Мок-доступы (пока нет бекенда)

| Роль | Email | Пароль |
|---|---|---|
| Админ | admin@kometa.web3 | admin |
| Главный отдела | lead@kometa.web3 | lead |
| Сотрудник | любой email | 1234 |

Кнопка «Войти через Google» — мок, логинит сотрудником. Реальный OAuth подключим на бекенде.

## Архитектура src

```
src/
  core/               логика приложения
    store/            zustand-сторы (authStore, uiStore)
    api/client.js     единая точка запросов к бекенду
    router/index.jsx  маршруты + гарды доступа
  shared/
    ui/               переиспользуемые компоненты, управляются пропсами
    layout/           Header, Footer, Sidebar (+MobileNav), AppLayout
    lib/              утилиты (cx — склейка классов)
  widgets/            обёртки-композиции: стили снаружи, контент через children
  pages/              страницы, собираются из shared + widgets
  index.css           токены дизайна (@theme) + глобальные стили
```

Правило слоёв: `pages → widgets → shared → core`. Ничего из pages не импортируем в shared.

## Дизайн-система

Токены в `src/index.css` в блоке `@theme` (Tailwind v4, конфиг-файла нет):

- Фон `space` #0E0E12, поверхности через класс `.glass`
- Акценты: `brand-blue` #504CFF → `brand-purple` #854CFF (градиент 135deg)
- Текст: `ink` / `ink-2` / `ink-3`
- Статусы: `ok`, `warn`, `danger`
- Шрифты: Jost (текст), JetBrains Mono (подписи, класс `.mono-caption`)
- Космический фон — компонент `<Cosmos />`, кладётся один раз в layout

Витрина всех компонентов: маршрут **/ui-kit** (служебный, в прод не отдаём).

## shared/ui — что есть

Импорт из одной точки: `import { Button, Input, Modal } from '../../shared/ui'`.

| Компонент | Ключевые пропсы |
|---|---|
| Button | variant: primary/secondary/outline/ghost/danger · size: sm/md/lg · loading · full · as |
| Input, Textarea, Select | label · hint · error · required · size; Select: options[], placeholder |
| Checkbox | label |
| Form / FormRow / FormActions | onSubmit(values) — объект значений формы |
| Modal | open · onClose · title · size: sm/md/lg · footer · closeOnOverlay |
| ConfirmModal | + onConfirm · confirmText · danger · loading |
| Badge | tone: ok/warn/danger/brand/neutral · dot |
| Pill, Card | Card: hover · pad: none/sm/md/lg |
| Avatar / AvatarStack | name · src · size · ring; Stack: users[] · max |
| Spinner, EmptyState, Cosmos | — |

## widgets

`PageSection` — шаблон страницы: pill + заголовок + subtitle + actions + children. Новые widgets делаем по тому же принципу: обёртка со стилями, содержимое пропсами.

## Роли и доступы

- Роутер: `Protected` (нет токена → /login), `AdminOnly` (не админ → /).
- Роли: `admin`, `lead` (главный отдела), `staff`.
- Sidebar сам добавляет пункт «Админ-панель» для админа первой вкладкой.

## Layout

- Десктоп: слева полноценный сайдбар (навигация + карточка пользователя с выходом внизу).
- Мобилка: сайдбар скрыт, в шапке справа бургер → drawer выезжает справа, внизу drawer — аватар с выходом.
- Выход всегда через ConfirmModal.

## Подключение бекенда

1. `.env`: `VITE_API_URL=https://api.…`
2. `core/api/client.js` уже шлёт `Authorization: Bearer <token>` и разлогинивает на 401.
3. В `core/store/authStore.js` заменить `mockLogin` и мок в `loginWithGoogle` на реальные вызовы `api.post('/auth/login')` / OAuth-флоу.
4. Сторы данных (отделы, работы, задачи) добавляем в `core/store/`, страницы к ним — в `pages/`.

## План страниц (по ТЗ, сейчас заглушки)

- **Иерархия** (/) — дерево отделов: блок отдела (главный + кругляшки сотрудников), «+» у главного → выбор клиента, описание работы, назначение сотрудников → дочерний блок со стрелкой; внутри блока — задачи по сотрудникам. Отдел видит только свою ветку, админ — все + переключатель отделов сверху.
- **Задачи** (/tasks) — борд: Сегодня → В процессе → Готово. Каждый утром ставит себе задачи со сроком; просрочка помечается «срок прошёл» и живёт до конца дня; done стирается в конце дня (крон на бекенде). Видимость: staff — свои, lead — весь свой отдел, admin — все.
- **Админ-панель** (/admin) — сотрудники: назначение в отделы, повышение, создание отделов, увольнение (отзыв доступа).
