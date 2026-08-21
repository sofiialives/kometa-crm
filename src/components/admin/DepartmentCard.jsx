import { useState } from 'react'
import { Card, Badge, EmptyState, Button, Input } from '../../shared/ui'
import { MemberRow } from './MemberRow'
import { memberCount, membersOf, splitByLead } from '../../utils/admin'
import { plural, withPlural } from '../../shared/lib/plural'

export function DepartmentCard({ department, users, onPromote, onMove, onDismiss, onAddPosition, onDelete, worksCount = 0, statsByUser }) {
  const members = membersOf(users, department.id)
  const { lead, staff } = splitByLead(members, department)
  // Бэк отказывает и при живых сотрудниках, и при незакрытых работах.
  // Показываем ту же причину заранее, чтобы удаление не срывалось на
  // последнем шаге.
  const blocker = members.length > 0
    ? 'Сначала переведите или увольте всех сотрудников отдела'
    : worksCount > 0
      ? `В отделе ${plural(worksCount, 'осталась', 'осталось', 'осталось')} ${withPlural(worksCount, 'работа', 'работы', 'работ')} — ${plural(worksCount, 'перенесите или удалите её', 'перенесите или удалите их', 'перенесите или удалите их')}`
      : null

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
          <h2 className="truncate text-lg font-semibold tracking-tight">{department.name}</h2>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {department.positions?.map((p) => (
              <span key={p} className="caption rounded-full border border-line px-2 py-0.5">{p}</span>
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
                className="caption rounded-full border border-dashed border-line-2 px-2 py-0.5 text-ink-3 transition-colors hover:border-accent/50 hover:text-ink cursor-pointer"
              >
                + должность
              </button>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="neutral">{memberCount(members.length)}</Badge>
          <button
            onClick={() => !blocker && onDelete(department)}
            disabled={Boolean(blocker)}
            title={blocker || 'Удалить отдел'}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors disabled:cursor-not-allowed disabled:opacity-35 enabled:hover:bg-danger-soft enabled:hover:text-danger cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
            </svg>
          </button>
        </div>
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
            <MemberRow user={lead} isLead onMove={onMove} onDismiss={onDismiss} stats={statsByUser?.[lead.id]} />
          ) : (
            <p className="rounded-xl border border-dashed border-line px-3 py-2.5 text-sm text-ink-3">
              Главный не назначен
            </p>
          )}

          {staff.length > 0 && <div className="mt-1 h-px bg-panel-2" />}

          {staff.map((u) => (
            <MemberRow
              key={u.id}
              user={u}
              onPromote={onPromote}
              onMove={onMove}
              onDismiss={onDismiss}
              stats={statsByUser?.[u.id]}
            />
          ))}
        </div>
      )}
    </Card>
  )
}