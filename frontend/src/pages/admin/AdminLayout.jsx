import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAdminStore } from '../../lib/store'
import { LayoutDashboard, BookOpen, Users, BarChart2, LogOut, ChevronRight } from 'lucide-react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/cards', icon: BookOpen, label: 'Knowledge Cards' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/stats', icon: BarChart2, label: 'Stats' },
]

export default function AdminLayout() {
  const { setIsAdmin } = useAdminStore()
  const navigate = useNavigate()

  const handleLogout = () => { setIsAdmin(false); navigate('/') }

  return (
    <div className="min-h-screen bg-dark-300 flex">
      {/* Sidebar */}
      <div className="w-56 bg-dark-500 border-r border-white/5 flex flex-col fixed h-full z-40 hidden md:flex">
        <div className="px-5 py-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            <div>
              <p className="font-display text-lg text-white leading-tight">Polymath</p>
              <p className="text-primary-400 text-xs font-bold">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all
                 ${isActive ? 'bg-primary-500/20 text-primary-400' : 'text-white/50 hover:text-white hover:bg-white/5'}`
              }>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-red-400 hover:bg-red-400/10 transition-all w-full">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-56">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-dark-500 border-b border-white/5">
          <span className="font-display text-white text-lg">🧪 Admin</span>
          <button onClick={handleLogout} className="text-red-400 text-sm font-bold">Logout</button>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto gap-2 px-4 py-2 bg-dark-500 border-b border-white/5 no-scrollbar">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex-shrink-0
                 ${isActive ? 'bg-primary-500/20 text-primary-400' : 'text-white/50 bg-dark-600'}`
              }>
              <Icon size={14} /> {label}
            </NavLink>
          ))}
        </div>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
