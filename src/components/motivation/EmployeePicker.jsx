import { Avatar } from '../../shared/ui'
import { cx } from '../../shared/lib/cx'

/**
 * Выбор сотрудников галочками. Нужен формам, где по заданию выбирают
 * нескольких сразу: «Пополнить банк» и «Клиент купил новый продукт».
 *
 * Обычный выпадающий список здесь не годится: в нём не видно, кого уже
 * отметил, а ошибиться с получателем денег хуже всего.
 */
export function EmployeePicker({ employees, value, onChange, label = 'Сотрудники', required, error }) {
  const selected = new Set(value)
  const toggle = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }
  const all = employees.length > 0 && employees.every((e) => selected.has(e.id))

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="caption select-none">
          {label}
          {required && <span className="text-accent ml-1">*</span>}
        </span>
        {employees.length > 1 && (
          <button
            type="button"
            onClick={() => onChange(all ? [] : employees.map((e) => e.id))}
            className="text-xs font-semibold text-accent hover:underline cursor-pointer"
          >
            {all ? 'Снять всех' : 'Выбрать всех'}
          </button>
        )}
      </div>

      {employees.length === 0 ? (
        <p className="text-sm text-ink-3">Нет сотрудников, которыми вы управляете.</p>
      ) : (
        <ul className={cx('flex max-h-56 flex-col overflow-y-auto rounded-[--radius-field] border', error ? 'border-danger' : 'border-line-2')}>
          {employees.map((e) => (
            <li key={e.id} className="border-b border-line last:border-b-0">
              {/* Кнопка, а не label с чекбоксом внутри: Checkbox сам по себе
                  label, а вложенные label переключали бы галочку дважды. */}
              <button
                type="button"
                role="checkbox"
                aria-checked={selected.has(e.id)}
                onClick={() => toggle(e.id)}
                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left hover:bg-panel-2"
              >
                <Box checked={selected.has(e.id)} />
                <Avatar name={e.name} email={e.email} src={e.avatarUrl} color={e.avatarColor} size={28} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{e.name}</span>
                  <span className="truncate text-xs text-ink-3">
                    {e.profile?.title || 'Профиль не назначен'}
                    {e.department ? ` · ${e.department.name}` : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-danger leading-snug">{error}</p>}
    </div>
  )
}

/** Та же галочка, что в Checkbox, только без своего label. */
function Box({ checked }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'grid place-items-center w-5 h-5 shrink-0 rounded-md border transition-colors duration-150',
        checked ? 'border-transparent bg-accent' : 'border-line-2 bg-panel-2',
      )}
    >
      <svg
        width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round" className={cx('transition-opacity duration-150', checked ? 'opacity-100' : 'opacity-0')}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  )
}
