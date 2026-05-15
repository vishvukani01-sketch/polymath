import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const features = [
  { icon: '🧠', title: 'Multi-Domain Learning', desc: 'Science, Philosophy, History, Tech & more' },
  { icon: '🔥', title: 'Daily Streaks', desc: 'Stay consistent with streaks' },
  { icon: '🏆', title: 'Leaderboards', desc: 'Compete with learners worldwide' },
  { icon: '⚡', title: 'XP & Levels', desc: 'Earn XP and level up your mind' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-yellow/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center px-6 pt-16 pb-10 max-w-lg mx-auto w-full">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.6 }} className="mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-orange-600 flex items-center justify-center shadow-neon text-5xl">🧪</div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-center mb-4">
          <h1 className="font-display text-6xl text-white mb-2">Polymath</h1>
          <p className="text-white/60 text-lg font-body leading-relaxed">Master multiple domains of knowledge. One card a day keeps ignorance away.</p>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="flex gap-6 mb-10">
          {[['10+', 'Domains'], ['500+', 'Cards'], ['Free', 'Forever']].map(([val, label]) => (
            <div key={label} className="flex flex-col items-center">
              <span className="font-display text-2xl gradient-text">{val}</span>
              <span className="text-white/40 text-xs font-body">{label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }} className="grid grid-cols-2 gap-3 w-full mb-10">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="card p-4">
              <span className="text-3xl mb-2 block">{icon}</span>
              <p className="font-bold text-white text-sm mb-0.5">{title}</p>
              <p className="text-white/40 text-xs">{desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 }} className="flex flex-col gap-3 w-full">
          <button onClick={() => navigate('/signup')} className="btn-primary w-full text-lg py-4">Start Learning Free 🚀</button>
          <button onClick={() => navigate('/login')} className="btn-secondary w-full">I already have an account</button>
        </motion.div>
      </div>
    </div>
  )
}
