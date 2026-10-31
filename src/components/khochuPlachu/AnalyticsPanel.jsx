import { Card } from '../../shared/ui'

const ROWS = [
  { key: 'added', label: 'Добавлено' },
  { key: 'approved', label: 'Одобрено' },
  { key: 'rejected', label: 'Отклонено' },
  { key: 'removed', label: 'Снято с одобренных' },
]

export function AnalyticsPanel({ analytics }) {
  if (!analytics) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card>
        <p className="caption pb-3">За текущий месяц</p>
        <div className="grid grid-cols-2 gap-3">
          {ROWS.map((r) => (
            <div key={r.key}>
              <p className="text-2xl font-bold tabular-nums">{analytics.month[r.key]}</p>
              <p className="text-xs text-ink-3">{r.label}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <p className="caption pb-3">За всё время</p>
        <div className="grid grid-cols-2 gap-3">
          {ROWS.map((r) => (
            <div key={r.key}>
              <p className="text-2xl font-bold tabular-nums">{analytics.allTime[r.key]}</p>
              <p className="text-xs text-ink-3">{r.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
