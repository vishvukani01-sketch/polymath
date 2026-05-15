import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore, useProgressStore } from '../lib/store'
import { DOMAINS, getDomainById } from '../lib/domains'
import { ACHIEVEMENTS, KNOWLEDGE_CARDS } from '../lib/knowledge'
import { getDueCards } from '../lib/spaced_repetition'
import { Zap, ChevronRight, Brain } from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { streakDays, totalXP, level, todayCompleted, domainProgress,
    achievements, reviewRecords, setStreak, setTotalXP, setDomainProgress, setReviewRecords } = useProgressStore()
  const [leaderRank, setLeaderRank] = useState(null)

  const userDomains = profile?.selected_domains || []
  const xpProgress = (totalXP % 500) / 500 * 100

  // Total due cards across all user domains
  const totalDueCards = useMemo(() => {
    let count = 0
    userDomains.forEach(domainId => {
      const cards = KNOWLEDGE_CARDS[domainId] || []
      const ids = cards.map(c => c.id)
      count += getDueCards(ids, reviewRecords).length
    })
    return count
  }, [userDomains, reviewRecords])

  useEffect(() => { if (user) syncProgress() }, [user])

  const syncProgress = async () => {
    const { data } = await supabase
      .from('profiles').select('streak_days, total_xp, level, domain_progress').eq('id', user.id).single()
    if (data) {
      setStreak(data.streak_days || 0)
      setTotalXP(data.total_xp || 0)
      setDomainProgress(data.domain_progress || {})
    }
    // Rank
    const { count } = await supabase
      .from('profiles').select('*', { count: 'exact', head: true }).gt('total_xp', data?.total_xp || 0)
    setLeaderRank((count || 0) + 1)

    // Load all SR records for user domains
    const { data: srData } = await supabase.from('sr_records').select('*').eq('user_id', user.id)
    if (srData) {
      const map = {}
      srData.forEach(r => {
        map[r.card_id] = { easeFactor: r.ease_factor, interval: r.interval, repetitions: r.repetitions, nextReview: r.next_review, lastReview: r.last_review }
      })
      setReviewRecords(map)
    }
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">

        {/* Stats row */}
        <motion.div variants={item} className="grid grid-cols-3 gap-3">
          {[
            { emoji: '🔥', val: streakDays, label: 'Day Streak' },
            { emoji: '⚡', val: totalXP.toLocaleString(), label: 'Total XP' },
            { emoji: '🏆', val: `#${leaderRank || '—'}`, label: 'Global Rank' },
          ].map(({ emoji, val, label }) => (
            <div key={label} className="card p-4 flex flex-col items-center gap-1">
              <span className="text-2xl">{emoji}</span>
              <span className="font-display text-xl text-white">{val}</span>
              <span className="text-white/40 text-xs font-body">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Level progress */}
        <motion.div variants={item} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-500/20 flex items-center justify-center">
                <Zap size={16} className="text-primary-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Level {level}</p>
                <p className="text-white/40 text-xs">{totalXP % 500} / 500 XP to next level</p>
              </div>
            </div>
            <span className="font-display text-lg gradient-text">Lv.{level}</span>
          </div>
          <div className="xp-bar">
            <motion.div className="xp-fill" initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }} transition={{ duration: 0.8, delay: 0.3 }} />
          </div>
        </motion.div>

        {/* Due cards CTA */}
        <motion.div variants={item}>
          {totalDueCards > 0 && !todayCompleted ? (
            <button onClick={() => navigate(`/learn/${userDomains[0] || 'science'}`)}
              className="w-full bg-gradient-to-r from-primary-500 to-orange-600 rounded-3xl p-5 text-left shadow-neon relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-8xl opacity-20">🧠</div>
              <div className="flex items-center gap-2 mb-1">
                <Brain size={14} className="text-primary-100" />
                <p className="text-primary-100 text-xs font-bold uppercase tracking-wide">Spaced Repetition</p>
              </div>
              <p className="font-display text-2xl text-white mb-1">{totalDueCards} Cards Due Today</p>
              <p className="text-white/70 text-sm font-body">Review before you forget them!</p>
              <div className="flex items-center gap-2 mt-3 text-white font-bold text-sm">
                Start Review <ChevronRight size={16} />
              </div>
            </button>
          ) : todayCompleted ? (
            <div className="card p-5 border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-3">
                <span className="text-4xl">✅</span>
                <div>
                  <p className="font-bold text-white">All done for today!</p>
                  <p className="text-white/50 text-sm font-body">Come back tomorrow to keep your streak</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-5 border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🎉</span>
                <div>
                  <p className="font-bold text-white">All caught up!</p>
                  <p className="text-white/50 text-sm font-body">No cards due today. Keep exploring!</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Your Domains */}
        <motion.div variants={item}>
          <h2 className="font-display text-xl text-white mb-3">Your Domains</h2>
          <div className="flex flex-col gap-3">
            {userDomains.map(domainId => {
              const domain = getDomainById(domainId)
              if (!domain) return null
              const progress = domainProgress[domainId] || 0
              const cards = KNOWLEDGE_CARDS[domainId] || []
              const due = getDueCards(cards.map(c => c.id), reviewRecords).length
              return (
                <button key={domainId} onClick={() => navigate(`/domain/${domainId}`)}
                  className="card p-4 flex items-center gap-4 hover:border-white/10 transition-all active:scale-[0.98] text-left w-full">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: domain.bgColor }}>
                    {domain.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-white">{domain.name}</p>
                      {due > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 ml-2">
                          {due} due
                        </span>
                      )}
                    </div>
                    <div className="xp-bar">
                      <div className="xp-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-white/30 text-xs mt-1">{progress}% complete</p>
                  </div>
                  <ChevronRight size={18} className="text-white/30 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Recent Achievements */}
        {achievements.length > 0 && (
          <motion.div variants={item}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl text-white">Achievements</h2>
              <button onClick={() => navigate('/achievements')} className="text-primary-400 text-sm font-bold">See all</button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {achievements.slice(0, 5).map(ach => (
                <div key={ach.id} className="card p-3 flex flex-col items-center gap-1 min-w-[80px] flex-shrink-0">
                  <span className="text-3xl">{ach.emoji}</span>
                  <span className="text-xs text-white/60 text-center font-body leading-tight">{ach.title}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
