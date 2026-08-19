import { cx } from '../lib/cx'

export function Form({ onSubmit, className, children, ...props }) {
  return (
    <form
      className={cx('flex flex-col gap-4', className)}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(Object.fromEntries(new FormData(e.currentTarget)), e)
      }}
      {...props}
    >
      {children}
    </form>
  )
}

export function FormRow({ className, children }) {
  return <div className={cx('grid gap-4 sm:grid-cols-2', className)}>{children}</div>
}

export function FormActions({ className, children }) {
  return <div className={cx('flex items-center justify-end gap-3 pt-2', className)}>{children}</div>
}
