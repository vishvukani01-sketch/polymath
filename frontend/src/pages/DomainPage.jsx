import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getDomainById } from '../lib/domains'
import { LEARNING_PATHS, KNOWLEDGE_CARDS } from '../lib/knowledge'
import { useProgressStore } from '../lib/store'
import { getDueCards, getDomainSRStats, getCardMaturity } from '../lib/spaced_repetition'
import { ChevronRight, Zap, Brain, Clock, BookOpen } from 'lucide-react'

export default function DomainPage() {
  const { domainId } = useParams()
  const navigate = useNavigate()
  const { domainProgress, reviewRecords } = useProgressStore()
  const domain = getDomainById(domainId)
  if (!domain) return <div className="p-6 text-white">Domain not found</div>

  const paths = LEARNING_PATHS[domainId] || []
  const cards = KNOWLEDGE_CARDS[domainId] || []
  const progress = domainProgress[domainId] || 0
  const cardIds = cards.map(c => c.id)

  const srStats = useMemo(() => getDomainSRStats(cardIds, reviewRecords), [cardIds, reviewRecords])
  const dueCount = srStats.dueCount + srStats.newCount

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
  const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }

  return (
    <div className="max-w-lg mx-auto">
      {/* Hero */}
      <div className="relative px-4 pt-4 pb-6 mb-2"
        style={{ background: `linear-gradient(135deg, ${domain.bgColor} 0%, #0A0A0F 100%)` }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-4xl"
            style={{ backgroundColor: domain.color + '30' }}>
            {domain.emoji}
          </div>
          <div>
            <h1 className="font-display text-3xl text-white">{domain.name}</h1>
            <p className="text-white/50 font-body text-sm">{domain.description}</p>
          </div>
        </div>
        <div className="card p-3">
          <div className="flex justify-between mb-2">
            <span className="text-white/60 text-sm font-bold">Overall Progress</span>
            <span className="text-white font-bold text-sm">{progress}%</span>
          </div>
          <div className="xp-bar">
            <motion.div className="xp-fill" style={{ background: `linear-gradient(90deg, ${domain.color}, ${domain.color}99)` }}
              initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
          </div>
        </div>
      </div>

      <div className="px-4">
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-5">

          {/* SR Stats row */}
          <motion.div variants={item} className="grid grid-cols-3 gap-2">
            {[
              { label: 'Due', val: srStats.dueCount, color: '#FF6B35', emoji: '⏰' },
              { label: 'New', val: srStats.newCount, color: '#2196F3', emoji: '🆕' },
              { label: 'Learned', val: srStats.learnedCount, color: '#4CAF50', emoji: '✅' },
            ].map(({ label, val, color, emoji }) => (
              <div key={label} className="card p-3 flex flex-col items-center gap-1">
                <span className="text-xl">{emoji}</span>
                <span className="font-display text-xl" style={{ color }}>{val}</span>
                <span className="text-white/40 text-xs font-body">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* Start session CTA */}
          <motion.div variants={item}>
            <button onClick={() => navigate(`/learn/${domainId}`)}
              className="w-full rounded-3xl p-5 text-left relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${domain.color}40, ${domain.color}15)`,
                border: `1px solid ${domain.color}40`
              }}>
              <div className="absolute -right-4 -bottom-4 text-7xl opacity-20">{domain.emoji}</div>
              <div className="flex items-center gap-2 mb-2">
                <Brain size={16} style={{ color: domain.color }} />
                <p className="text-sm font-bold" style={{ color: domain.color }}>SPACED REPETITION SESSION</p>
              </div>
              <p className="font-display text-2xl text-white mb-1">
                {dueCount > 0 ? `${dueCount} Cards Due` : 'All Caught Up!'}
              </p>
              <p className="text-white/60 text-sm font-body">
                {dueCount > 0
                  ? 'Review cards scheduled for today'
                  : 'No cards due — check back tomorrow'}
              </p>
              {dueCount > 0 && (
                <div className="flex items-center gap-2 mt-3 font-bold text-sm text-white">
                  Start Review <ChevronRight size={16} />
                </div>
              )}
            </button>
          </motion.div>

          {/* Card list with maturity */}
          <motion.div variants={item}>
            <h2 className="font-display text-xl text-white mb-3">All Cards</h2>
            <div className="flex flex-col gap-2">
              {cards.map(card => {
                const maturity = getCardMaturity(reviewRecords[card.id])
                const record = reviewRecords[card.id]
                const nextDate = record?.nextReview
                  ? new Date(record.nextReview).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : 'New'
                return (
                  <div key={card.id} className="card p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-display flex-shrink-0"
                      style={{ backgroundColor: maturity.color + '20', color: maturity.color }}>
                      {card.xp}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{card.title}</p>
                      <p className="text-white/30 text-xs font-body">{card.topic}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ color: maturity.color, backgroundColor: maturity.color + '20' }}>
                        {maturity.label}
                      </span>
                      <span className="text-white/25 text-xs flex items-center gap-1">
                        <Clock size={9} /> {nextDate}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Topics */}
          <motion.div variants={item}>
            <h2 className="font-display text-xl text-white mb-3">Topics</h2>
            <div className="flex flex-wrap gap-2">
              {domain.topics.map(topic => (
                <span key={topic} className="px-3 py-1.5 rounded-full text-sm font-bold text-white/70 border border-white/10 bg-dark-500">
                  {topic}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Learning Paths */}
          <motion.div variants={item}>
            <h2 className="font-display text-xl text-white mb-3">Learning Paths</h2>
            <div className="flex flex-col gap-3 pb-4">
              {paths.map((path, idx) => (
                <div key={path.id} className="card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-display text-lg"
                    style={{ backgroundColor: domain.color + '20', color: domain.color }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{path.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-white/40 text-xs font-body">{path.lessons} lessons</span>
                      <span className="text-white/40 text-xs">·</span>
                      <span className="text-accent-yellow text-xs font-bold flex items-center gap-1">
                        <Zap size={10} /> {path.xp} XP
                      </span>
                      <span className="text-white/40 text-xs">·</span>
                      <span className="text-white/40 text-xs capitalize">{path.difficulty}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/30 flex-shrink-0" />
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
