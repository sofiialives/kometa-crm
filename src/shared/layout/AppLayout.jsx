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
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 min-w-0 px-5 py-6">
          <div className="mx-auto max-w-[1180px]">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
