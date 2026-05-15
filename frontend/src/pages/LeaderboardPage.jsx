import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore, useProgressStore } from '../lib/store'
import { Trophy, Zap, Flame } from 'lucide-react'

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function LeaderboardPage() {
  const { user } = useAuthStore()
  const { totalXP } = useProgressStore()
  const [leaders, setLeaders] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [tab, setTab] = useState('global') // global | weekly
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLeaderboard() }, [tab])

  const fetchLeaderboard = async () => {
    setLoading(true)
    let query = supabase.from('profiles')
      .select('id, display_name, total_xp, streak_days, level, selected_domains')
      .order('total_xp', { ascending: false })
      .limit(50)

    if (tab === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      query = supabase.from('profiles')
        .select('id, display_name, total_xp, streak_days, level, selected_domains')
        .gte('updated_at', weekAgo)
        .order('total_xp', { ascending: false })
        .limit(50)
    }

    const { data } = await query
    setLoading(false)
    if (data) {
      setLeaders(data)
      const rank = data.findIndex(d => d.id === user?.id)
      setMyRank(rank >= 0 ? rank + 1 : null)
    }
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
  const item = { hidden: { x: -20, opacity: 0 }, show: { x: 0, opacity: 1 } }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['global', 'weekly'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all capitalize
              ${tab === t ? 'bg-primary-500 text-white shadow-neon' : 'bg-dark-500 text-white/50'}`}>
            {t === 'global' ? '🌍 All Time' : '📅 This Week'}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {!loading && leaders.length >= 3 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-center gap-3 mb-8 h-40">
          {/* 2nd */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-dark-500 border-2 border-gray-400 flex items-center justify-center text-xl font-display">
              {leaders[1]?.display_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="text-center">
              <p className="text-2xl">🥈</p>
              <p className="text-white text-xs font-bold truncate max-w-[60px]">{leaders[1]?.display_name}</p>
              <p className="text-accent-yellow text-xs font-bold">{(leaders[1]?.total_xp || 0).toLocaleString()}</p>
            </div>
            <div className="w-16 h-16 bg-gray-600/30 rounded-t-xl flex items-end justify-center pb-1 text-xs text-white/40 font-bold">2</div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-dark-500 border-2 border-accent-yellow flex items-center justify-center text-2xl font-display shadow-neon-yellow">
              {leaders[0]?.display_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="text-center">
              <p className="text-3xl">🥇</p>
              <p className="text-white text-xs font-bold truncate max-w-[70px]">{leaders[0]?.display_name}</p>
              <p className="text-accent-yellow text-xs font-bold">{(leaders[0]?.total_xp || 0).toLocaleString()}</p>
            </div>
            <div className="w-16 h-24 bg-accent-yellow/20 rounded-t-xl flex items-end justify-center pb-1 text-xs text-white/40 font-bold">1</div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-dark-500 border-2 border-orange-700 flex items-center justify-center text-xl font-display">
              {leaders[2]?.display_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="text-center">
              <p className="text-2xl">🥉</p>
              <p className="text-white text-xs font-bold truncate max-w-[60px]">{leaders[2]?.display_name}</p>
              <p className="text-accent-yellow text-xs font-bold">{(leaders[2]?.total_xp || 0).toLocaleString()}</p>
            </div>
            <div className="w-16 h-10 bg-orange-700/20 rounded-t-xl flex items-end justify-center pb-1 text-xs text-white/40 font-bold">3</div>
          </div>
        </motion.div>
      )}

      {/* Your rank callout */}
      {myRank && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card p-3 mb-4 flex items-center gap-3 border border-primary-500/30 bg-primary-500/5">
          <Trophy size={18} className="text-primary-400" />
          <span className="text-white font-bold text-sm">Your rank: #{myRank}</span>
          <span className="ml-auto text-accent-yellow text-sm font-bold flex items-center gap-1">
            <Zap size={12} /> {totalXP.toLocaleString()} XP
          </span>
        </motion.div>
      )}

      {/* Full list */}
      {loading ? (
        <div className="flex justify-center py-10 text-white/40">Loading...</div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-2">
          {leaders.slice(3).map((leader, idx) => {
            const rank = idx + 4
            const isMe = leader.id === user?.id
            return (
              <motion.div key={leader.id} variants={item}
                className={`card p-4 flex items-center gap-3 ${isMe ? 'border border-primary-500/40 bg-primary-500/5' : ''}`}>
                <span className="w-7 text-center font-bold text-white/40 text-sm">{rank}</span>
                <div className="w-9 h-9 rounded-full bg-dark-600 border border-white/10 flex items-center justify-center font-display text-sm">
                  {leader.display_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{leader.display_name} {isMe ? '(You)' : ''}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-xs font-body">Lv.{leader.level}</span>
                    {leader.streak_days > 0 && (
                      <span className="text-orange-400 text-xs flex items-center gap-0.5">
                        <Flame size={10} /> {leader.streak_days}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-accent-yellow font-bold text-sm flex items-center gap-1">
                  <Zap size={12} /> {(leader.total_xp || 0).toLocaleString()}
                </span>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
