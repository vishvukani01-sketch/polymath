import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { DOMAINS } from '../../lib/domains'
import { KNOWLEDGE_CARDS } from '../../lib/knowledge'
import { Users, BookOpen, Zap, TrendingUp, Activity } from 'lucide-react'

export default function AdminOverview() {
  const [stats, setStats] = useState(null)
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    setLoading(true)
    const [{ count: totalUsers }, { count: activeToday }, { data: users }, { data: activity }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
        .gte('last_activity_date', new Date().toISOString().split('T')[0]),
      supabase.from('profiles').select('display_name, total_xp, streak_days, created_at, selected_domains')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('activity_log').select('xp_earned').gte('created_at', new Date(Date.now() - 7 * 864e5).toISOString()),
    ])

    const totalCards = Object.values(KNOWLEDGE_CARDS).reduce((s, arr) => s + arr.length, 0)
    const weeklyXP = activity?.reduce((s, r) => s + (r.xp_earned || 0), 0) || 0

    setStats({ totalUsers: totalUsers || 0, activeToday: activeToday || 0, totalCards, weeklyXP })
    setRecentUsers(users || [])
    setLoading(false)
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
  const item = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
      <motion.div variants={item}>
        <h1 className="font-display text-3xl text-white mb-1">Overview</h1>
        <p className="text-white/40 font-body text-sm">Polymath platform stats at a glance</p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Users', val: stats?.totalUsers ?? '—', color: '#2196F3' },
          { icon: Activity, label: 'Active Today', val: stats?.activeToday ?? '—', color: '#4CAF50' },
          { icon: BookOpen, label: 'Total Cards', val: stats?.totalCards ?? '—', color: '#FF6B35' },
          { icon: Zap, label: 'Weekly XP', val: stats?.weeklyXP?.toLocaleString() ?? '—', color: '#FFD700' },
        ].map(({ icon: Icon, label, val, color }) => (
          <div key={label} className="card p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: color + '20' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p className="font-display text-2xl text-white">{val}</p>
            <p className="text-white/40 text-xs font-body mt-1">{label}</p>
          </div>
        ))}
      </motion.div>

      {/* Domain card counts */}
      <motion.div variants={item}>
        <h2 className="font-display text-xl text-white mb-3">Cards per Domain</h2>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-white/40 text-xs font-bold uppercase">Domain</th>
                <th className="text-center px-4 py-3 text-white/40 text-xs font-bold uppercase">Cards</th>
                <th className="text-center px-4 py-3 text-white/40 text-xs font-bold uppercase">Topics</th>
              </tr>
            </thead>
            <tbody>
              {DOMAINS.map(d => (
                <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{d.emoji}</span>
                      <span className="text-white font-bold text-sm">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-display text-lg" style={{ color: d.color }}>
                      {(KNOWLEDGE_CARDS[d.id] || []).length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-white/40 text-sm">{d.topics.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Recent users */}
      <motion.div variants={item}>
        <h2 className="font-display text-xl text-white mb-3">Recent Sign-ups</h2>
        <div className="card overflow-hidden">
          {recentUsers.length === 0 ? (
            <p className="text-white/30 text-center py-8 font-body">No users yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-white/40 text-xs font-bold uppercase">User</th>
                  <th className="text-center px-4 py-3 text-white/40 text-xs font-bold uppercase">XP</th>
                  <th className="text-center px-4 py-3 text-white/40 text-xs font-bold uppercase">Streak</th>
                  <th className="text-right px-4 py-3 text-white/40 text-xs font-bold uppercase">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center font-display text-sm text-primary-400">
                          {u.display_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white text-sm font-bold">{u.display_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-accent-yellow text-sm font-bold">{u.total_xp?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-orange-400 text-sm font-bold">{u.streak_days}🔥</td>
                    <td className="px-4 py-3 text-right text-white/30 text-xs font-body">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
