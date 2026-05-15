import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Trophy, Star, User } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { to: '/achievements', icon: Star, label: 'Goals' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary-500/20' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className="text-xs font-bold">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
