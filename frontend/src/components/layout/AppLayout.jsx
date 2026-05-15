import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import TopBar from './TopBar'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-300">
      <TopBar />
      <main className="flex-1 pb-24 pt-16 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
