import { useCallback, useEffect, useRef } from 'react'
import { newRequestKey } from '../../utils/motivation'

/**
 * Ключ запроса для защиты от повторной отправки формы.
 *
 * Повтор тех же данных — двойное нажатие или новая попытка после обрыва
 * связи — уходит с тем же ключом, и сервер не проведёт операцию второй раз.
 * Поменяли сумму или людей после ошибки — это уже другая операция, и ключ
 * новый: иначе сервер узнал бы в ней первую попытку и молча вернул старую
 * запись вместо новой суммы. Каждое открытие формы начинает с чистого листа.
 *
 *   const keyFor = useRequestKey(open)
 *   onSubmit({ ...body, requestKey: keyFor(body) })
 */
export function useRequestKey(open) {
  const last = useRef(null)

  useEffect(() => {
    if (open) last.current = null
  }, [open])

  return useCallback((payload) => {
    const json = JSON.stringify(payload)
    if (last.current?.json !== json) last.current = { json, key: newRequestKey() }
    return last.current.key
  }, [])
}
