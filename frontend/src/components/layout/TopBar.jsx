import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, useProgressStore } from '../../lib/store'
import { Flame, Zap, ChevronLeft } from 'lucide-react'

const PAGE_TITLES = {
  '/dashboard': null,
  '/leaderboard': 'Leaderboard',
  '/achievements': 'Achievements',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

export default function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuthStore()
  const { streakDays, totalXP, level } = useProgressStore()

  const isDashboard = location.pathname === '/dashboard'
  const title = PAGE_TITLES[location.pathname]
  const isDomainOrLearn = location.pathname.includes('/domain/') || location.pathname.includes('/learn/')

  return (
    <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 safe-top">
      <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
        {/* Left */}
        <div className="flex items-center gap-2">
          {isDomainOrLearn ? (
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <ChevronLeft size={22} />
            </button>
          ) : isDashboard ? (
            <div>
              <p className="text-white/50 text-xs font-body">Good {getGreeting()},</p>
              <p className="font-display text-lg text-white leading-tight">
                {profile?.display_name || 'Scholar'} 👋
              </p>
            </div>
          ) : (
            <h1 className="font-display text-xl text-white">{title}</h1>
          )}
        </div>

        {/* Right - Stats */}
        <div className="flex items-center gap-2">
          {/* Streak */}
          <div className="streak-badge">
            <Flame size={14} className="animate-streak-flame" />
            <span>{streakDays}</span>
          </div>

          {/* XP & Level */}
          <div className="flex items-center gap-1 bg-accent-yellow/10 border border-accent-yellow/20 
                          rounded-full px-3 py-1.5 text-accent-yellow font-bold text-sm">
            <Zap size={14} />
            <span>{totalXP.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
