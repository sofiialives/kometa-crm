import { useState } from 'react'
import { Button } from '../../shared/ui'
import { useMotivationStore } from '../../core/store/motivationStore'
import { ProductModal } from './ProductModal'

/**
 * «Клиент купил продукт» прямо из карточки клиента. Форма открывается уже
 * с этим клиентом и с теми, кто работает с ним в Иерархии: чаще всего
 * продукт купили благодаря им. Каждый отмеченный получает полные баллы
 * события из своего профиля.
 */
export function ClientProductButton({ client, className }) {
  const { fetchClientPeople, fetchEmployees, employees, addProduct } = useMotivationStore()
  const [open, setOpen] = useState(false)
  const [people, setPeople] = useState([])
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)

  async function start() {
    setError(null)
    setDone(null)
    const [res] = await Promise.all([fetchClientPeople(client.id), fetchEmployees()])
    if (!res.ok) {
      setError(res.error)
      return
    }
    setPeople(res.data.people.map((p) => p.id))
    setOpen(true)
  }

  return (
    <>
      <Button variant="secondary" className={className} onClick={start}>Клиент купил новый продукт</Button>
      {error && <span className="text-xs text-danger">{error}</span>}
      {done && <span className="whitespace-nowrap text-xs text-ok">{done}</span>}
      <ProductModal
        open={open}
        onClose={() => setOpen(false)}
        employees={employees}
        clients={[client]}
        preselected={people}
        presetClientId={client.id}
        onSubmit={async (body) => {
          const res = await addProduct(body)
          if (res.ok) setDone(`Баллы начислены: ${res.data.count} чел.`)
          return res
        }}
      />
    </>
  )
}
