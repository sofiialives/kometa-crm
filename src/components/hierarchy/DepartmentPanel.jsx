import { Card, Badge, Avatar, AvatarStack } from '../../shared/ui'
import { displayName, memberCount, membersOf, splitByLead } from '../../utils/admin'

export function DepartmentPanel({ department, users, worksCount, canSeeMembers, canInvite, onInvite }) {
  const members = membersOf(users, department.id)
  const { lead, staff } = splitByLead(members, department)

  // Список сотрудников бэк отдаёт только админу и главному. Рядовому остаётся
  // главный отдела — он приходит вместе со списком отделов.
  const head = lead || department.lead || null

  return (
    <Card pad="md" className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{department.name}</h2>
        {canSeeMembers && (
          <Badge tone="neutral">{memberCount(members.length)}</Badge>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="caption">Главный отдела</span>
        {head ? (
          <div className="flex items-center gap-3">
            <Avatar name={displayName(head)} src={head.avatarUrl} color={head.avatarColor} size={40} ring />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium leading-tight">{displayName(head)}</p>
              <p className="caption truncate">{head.position || 'Начальник отдела'}</p>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-line px-3 py-2.5 text-sm text-ink-3">
            Не назначен
          </p>
        )}
      </div>

      {canSeeMembers && (
        <div className="flex flex-col gap-2">
          <span className="caption">Сотрудники</span>
          <div className="flex items-center gap-2">
            {staff.length > 0 ? (
              <AvatarStack users={staff.map((u) => ({ id: u.id, name: displayName(u), src: u.avatarUrl }))} size={30} />
            ) : (
              <span className="text-sm text-ink-3">Пока никого</span>
            )}
            {canInvite && (
              <button
                onClick={onInvite}
                aria-label="Добавить сотрудника"
                className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full panel text-ink-3 transition-colors hover:border-accent/50 hover:text-ink cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="border-t border-line pt-3">
        <p className="caption">Активные работы · {worksCount}</p>
      </div>
    </Card>
  )
}
