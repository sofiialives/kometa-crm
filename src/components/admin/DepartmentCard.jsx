import { useState } from 'react'
import { Card, Badge, EmptyState, Button, Input } from '../../shared/ui'
import { MemberRow } from './MemberRow'
import { memberCount, membersOf, splitByLead } from '../../utils/admin'

export function DepartmentCard({ department, users, onPromote, onMove, onDismiss, onAddPosition }) {
  const members = membersOf(users, department.id)
  const { lead, staff } = splitByLead(members, department)

  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  async function submitPosition() {
    const value = draft.trim()
    if (!value) return setAdding(false)
    setSaving(true)
    await onAddPosition(department, value)
    setSaving(false)
    setDraft('')
    setAdding(false)
  }

  return (
    <Card pad="md" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-semibold tracking-tight">{department.name}</h2>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {department.positions?.map((p) => (
              <span key={p} className="mono-caption rounded-full border border-white/10 px-2 py-0.5">{p}</span>
            ))}

            {adding ? (
              <div className="flex items-center gap-1.5">
                <Input
                  size="sm"
                  autoFocus
                  placeholder="Новая должность"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); submitPosition() }
                    if (e.key === 'Escape') { setAdding(false); setDraft('') }
                  }}
                  className="w-40"
                />
                <Button size="sm" variant="secondary" loading={saving} onClick={submitPosition}>ОК</Button>
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="mono-caption rounded-full border border-dashed border-white/20 px-2 py-0.5 text-ink-3 transition-colors hover:border-brand-purple/50 hover:text-ink cursor-pointer"
              >
                + должность
              </button>
            )}
          </div>
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
