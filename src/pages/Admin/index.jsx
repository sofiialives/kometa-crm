import { PageSection } from '../../widgets'
import { EmptyState } from '../../shared/ui'

export default function AdminPage() {
  return (
    <PageSection pill="Админ-панель" title="Админ-панель">
      <EmptyState label="Пусто" text="Страница в разработке." />
    </PageSection>
  )
}
