import { motion } from 'framer-motion'
import { useProgressStore } from '../lib/store'
import { ACHIEVEMENTS } from '../lib/knowledge'
import { Zap, Lock } from 'lucide-react'

export default function AchievementsPage() {
  const { achievements, totalXP, streakDays, level } = useProgressStore()
  const earned = achievements.map(a => a.id)

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
  const item = { hidden: { scale: 0.8, opacity: 0 }, show: { scale: 1, opacity: 1 } }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      {/* Summary */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="card p-4 mb-6 flex items-center gap-4">
        <div className="text-4xl">🏆</div>
        <div>
          <p className="font-bold text-white">{earned.length} / {ACHIEVEMENTS.length} Unlocked</p>
          <div className="xp-bar mt-2 w-48">
            <div className="xp-fill" style={{ width: `${(earned.length / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-3">
        {ACHIEVEMENTS.map((ach) => {
          const isEarned = earned.includes(ach.id)
          return (
            <motion.div key={ach.id} variants={item}
              className={`card p-4 flex items-center gap-4 transition-all ${isEarned ? 'border border-accent-yellow/20 bg-accent-yellow/5' : 'opacity-60'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${isEarned ? 'bg-accent-yellow/15' : 'bg-dark-600'}`}>
                {isEarned ? ach.emoji : <Lock size={20} className="text-white/30" />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">{ach.title}</p>
                <p className="text-white/50 text-xs font-body mt-0.5">{ach.description}</p>
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold ${isEarned ? 'text-accent-yellow' : 'text-white/20'}`}>
                <Zap size={12} /> {ach.xp}
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
