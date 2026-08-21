import { Modal, Avatar, Badge } from '../../shared/ui'
import { displayName, membersOf, splitByLead } from '../../utils/admin'

/*
 * Состав отдела списком. В карточке отдела помещается только стопка
 * аватаров, по которой не понять, кто есть кто — сотрудники просили
 * видеть имена и почты. Главный идёт первым: он отвечает за отдел.
 */
export function MembersModal({ department, users, onClose }) {
  const members = department ? membersOf(users, department.id) : []
  const { lead, staff } = department ? splitByLead(members, department) : { lead: null, staff: [] }
  const ordered = [...(lead ? [lead] : []), ...staff]

  return (
    <Modal
      open={Boolean(department)}
      onClose={onClose}
      title={department ? `Отдел «${department.name}»` : ''}
      size="sm"
    >
      {ordered.length === 0 ? (
        <p className="text-sm text-ink-3">В отделе пока никого нет.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {ordered.map((u) => (
            <li key={u.id} className="flex items-center gap-3 rounded-lg px-1 py-2">
              <Avatar
                name={u.name}
                email={u.email}
                src={u.avatarUrl}
                color={u.avatarColor}
                size={38}
                ring={u.id === lead?.id}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{displayName(u)}</p>
                {/* Почта под именем — по ней узнают человека в переписке. Но у
                    тех, кто ещё не заполнил имя, сверху уже стоит она сама,
                    и повторять её второй строкой незачем. */}
                {displayName(u) !== u.email && (
                  <p className="truncate text-xs text-ink-3">{u.email}</p>
                )}
              </div>
              {u.position && (
                <Badge tone={u.id === lead?.id ? 'brand' : 'neutral'} className="shrink-0">
                  {u.position}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
