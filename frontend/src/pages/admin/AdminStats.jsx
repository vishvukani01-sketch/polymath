import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { DOMAINS } from '../../lib/domains'
import { KNOWLEDGE_CARDS } from '../../lib/knowledge'

export default function AdminStats() {
  const [domainStats, setDomainStats] = useState([])
  const [retentionData, setRetentionData] = useState([])
  const [srStats, setSrStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    setLoading(true)

    // Domain activity counts
    const { data: activityData } = await supabase
      .from('activity_log')
      .select('domain_id, xp_earned, cards_completed')

    // SR records stats
    const { data: srData, count: srCount } = await supabase
      .from('sr_records')
      .select('interval, repetitions, ease_factor', { count: 'exact' })

    // Daily active users (last 14 days)
    const { data: dailyActive } = await supabase
      .from('profiles')
      .select('last_activity_date')
      .gte('last_activity_date', new Date(Date.now() - 14 * 864e5).toISOString().split('T')[0])

    setLoading(false)

    // Aggregate domain stats
    const domainAgg = {}
    activityData?.forEach(({ domain_id, xp_earned, cards_completed }) => {
      if (!domainAgg[domain_id]) domainAgg[domain_id] = { sessions: 0, xp: 0, cards: 0 }
      domainAgg[domain_id].sessions++
      domainAgg[domain_id].xp += xp_earned || 0
      domainAgg[domain_id].cards += cards_completed || 0
    })

    const domStats = DOMAINS.map(d => ({
      ...d,
      sessions: domainAgg[d.id]?.sessions || 0,
      xp: domainAgg[d.id]?.xp || 0,
      cards: domainAgg[d.id]?.cards || 0,
      cardCount: (KNOWLEDGE_CARDS[d.id] || []).length,
    })).sort((a, b) => b.sessions - a.sessions)
    setDomainStats(domStats)

    // Daily active (last 14 days)
    const dayMap = {}
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5).toISOString().split('T')[0]
      dayMap[d] = 0
    }
    dailyActive?.forEach(u => { if (u.last_activity_date && dayMap[u.last_activity_date] !== undefined) dayMap[u.last_activity_date]++ })
    setRetentionData(Object.entries(dayMap).map(([date, count]) => ({ date, count })))

    // SR summary
    if (srData) {
      const mature = srData.filter(r => r.interval >= 21).length
      const young = srData.filter(r => r.interval >= 7 && r.interval < 21).length
      const learning = srData.filter(r => r.interval < 7 && r.repetitions > 0).length
      const avgEase = srData.reduce((s, r) => s + (r.ease_factor || 2.5), 0) / (srData.length || 1)
      setSrStats({ total: srCount || 0, mature, young, learning, avgEase: avgEase.toFixed(2) })
    }
  }

  const maxBar = Math.max(...retentionData.map(d => d.count), 1)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-white mb-1">Platform Stats</h1>
        <p className="text-white/40 font-body text-sm">Engagement, retention and spaced repetition metrics</p>
      </div>

      {/* SR Stats */}
      {srStats && (
        <div>
          <h2 className="font-display text-xl text-white mb-3">Spaced Repetition Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total Reviews', val: srStats.total.toLocaleString(), color: '#2196F3' },
              { label: 'Mature Cards', val: srStats.mature.toLocaleString(), color: '#9C27B0' },
              { label: 'Young Cards', val: srStats.young.toLocaleString(), color: '#4CAF50' },
              { label: 'Still Learning', val: srStats.learning.toLocaleString(), color: '#FF9800' },
              { label: 'Avg Ease Factor', val: srStats.avgEase, color: '#FF6B35' },
            ].map(({ label, val, color }) => (
              <div key={label} className="card p-4 text-center">
                <p className="font-display text-xl" style={{ color }}>{val}</p>
                <p className="text-white/40 text-xs font-body mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Active Users chart */}
      <div>
        <h2 className="font-display text-xl text-white mb-3">Daily Active Users (14 days)</h2>
        <div className="card p-5">
          <div className="flex items-end gap-1.5 h-32">
            {retentionData.map(({ date, count }) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-white/40 text-xs font-body">{count > 0 ? count : ''}</span>
                <div className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(4, (count / maxBar) * 80)}px`,
                    backgroundColor: count > 0 ? '#FF6B35' : '#252535',
                  }} />
                <span className="text-white/20 text-xs font-body" style={{ fontSize: '9px' }}>
                  {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Domain popularity */}
      <div>
        <h2 className="font-display text-xl text-white mb-3">Domain Popularity</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-white/40 text-xs font-bold uppercase">Domain</th>
                <th className="text-center px-4 py-3 text-white/40 text-xs font-bold uppercase">Sessions</th>
                <th className="text-center px-4 py-3 text-white/40 text-xs font-bold uppercase hidden md:table-cell">Cards Completed</th>
                <th className="text-center px-4 py-3 text-white/40 text-xs font-bold uppercase hidden md:table-cell">XP Generated</th>
                <th className="text-right px-4 py-3 text-white/40 text-xs font-bold uppercase">Cards in DB</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-white/30">Loading...</td></tr>
              ) : domainStats.map(d => (
                <tr key={d.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{d.emoji}</span>
                      <span className="font-bold text-white">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-1.5 rounded-full bg-dark-600 w-16 overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${Math.min(100, (d.sessions / Math.max(...domainStats.map(s => s.sessions), 1)) * 100)}%`,
                          backgroundColor: d.color
                        }} />
                      </div>
                      <span className="font-bold text-white">{d.sessions}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-white/60 hidden md:table-cell">{d.cards}</td>
                  <td className="px-4 py-3 text-center text-accent-yellow font-bold hidden md:table-cell">
                    {d.xp.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: d.color }}>{d.cardCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
