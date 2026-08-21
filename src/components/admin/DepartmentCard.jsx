import { Card, Badge, EmptyState } from '../../shared/ui'
import { MemberRow } from './MemberRow'
import { memberCount, membersOf, splitByLead } from '../../utils/admin'

export function DepartmentCard({ department, users, onPromote, onMove, onDismiss }) {
  const members = membersOf(users, department.id)
  const { lead, staff } = splitByLead(members, department)

  return (
    <Card pad="md" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-semibold tracking-tight">{department.name}</h2>
          {department.positions?.length > 0 && (
            <p className="mono-caption mt-1 truncate">{department.positions.join(' · ')}</p>
          )}
        </div>
        <Badge tone="neutral" dot={false}>{memberCount(members.length)}</Badge>
      </div>

      {members.length === 0 ? (
        <EmptyState
          label="Никого нет"
          text={
            department.positions?.length
              ? 'Пригласите первого сотрудника в этот отдел.'
              : 'Сначала добавьте должности, иначе приглашать будет некого.'
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {lead ? (
            <MemberRow user={lead} isLead onMove={onMove} onDismiss={onDismiss} />
          ) : (
            <p className="rounded-xl border border-dashed border-white/12 px-3 py-2.5 text-[13px] text-ink-3">
              Главный не назначен
            </p>
          )}

          {staff.length > 0 && <div className="mt-1 h-px bg-white/8" />}

          {staff.map((u) => (
            <MemberRow
              key={u.id}
              user={u}
              onPromote={onPromote}
              onMove={onMove}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      )}
    </Card>
  )
}
