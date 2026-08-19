import { PageSection } from '../../widgets'
import { EmptyState } from '../../shared/ui'

export default function TasksPage() {
  return (
    <PageSection pill="Задачи" title="Задачи">
      <EmptyState label="Пусто" text="Страница в разработке." />
    </PageSection>
  )
}
