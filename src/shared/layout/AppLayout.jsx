import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar, MobileNav } from './Sidebar'
import { Cosmos } from '../ui/Cosmos'

export function AppLayout() {
  return (
    <div className="min-h-full flex flex-col">
      <Cosmos />
      <Header />
      <MobileNav />
      <div className="mx-auto max-w-[1360px] w-full px-5 flex-1 flex gap-6 py-6">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
