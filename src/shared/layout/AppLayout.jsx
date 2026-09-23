import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar, MobileNav } from './Sidebar'
import { NameGate } from './NameGate'
import { cx } from '../lib/cx'

export function AppLayout() {
  const wide = useLocation().pathname.startsWith('/calls')

  return (
    <div className="min-h-full flex flex-col">
      <NameGate />
      <Header />
      <MobileNav />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 min-w-0 px-5 py-6">
          {/* Календарю звонков нужно уместить семь колонок в один ряд:
              на общем пределе в 1180px каждой доставалось бы по 160px
              даже на большом мониторе. Остальные страницы шире не
              становятся — у них три колонки, и растягивать их не за чем. */}
          <div className={cx('mx-auto', wide ? 'max-w-[1600px]' : 'max-w-[1180px]')}>
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
