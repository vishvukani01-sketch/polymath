import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuthStore, useProgressStore } from '../lib/store'
import { getDomainById } from '../lib/domains'
import { KNOWLEDGE_CARDS, ACHIEVEMENTS } from '../lib/knowledge'
import { calculateNextReview, getDueCards, getCardMaturity } from '../lib/spaced_repetition'
import { X, Share2, Zap, Heart, Brain, Clock, Star } from 'lucide-react'

// Map user action to SR quality score
const ACTION_QUALITY = { perfect: 5, knew: 4, hard: 2, forgot: 1 }

export default function LearnPage() {
  const { domainId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    addXP, setStreak, streakDays, setTodayCompleted,
    addAchievement, domainProgress, setDomainProgress,
    reviewRecords, updateReviewRecord, setReviewRecords,
  } = useProgressStore()

  const domain = getDomainById(domainId)
  const allCards = KNOWLEDGE_CARDS[domainId] || []

  // ── Compute which cards are due via SR ──────────────────────
  const dueCardIds = useMemo(
    () => getDueCards(allCards.map(c => c.id), reviewRecords),
    [domainId, reviewRecords]
  )
  const sessionCards = useMemo(
    () => allCards.filter(c => dueCardIds.includes(c.id)).slice(0, 10), // max 10/session
    [dueCardIds]
  )

  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [sessionXP, setSessionXP] = useState(0)
  const [sessionStats, setSessionStats] = useState({ perfect: 0, knew: 0, hard: 0, forgot: 0 })
  const [lives, setLives] = useState(3)

  const currentCard = sessionCards[cardIndex]
  const progress = sessionCards.length > 0 ? (cardIndex / sessionCards.length) * 100 : 0
  const maturity = currentCard ? getCardMaturity(reviewRecords[currentCard.id]) : null

  // ── Handle answer ─────────────────────────────────────────
  const handleAnswer = async (action) => {
    if (answered) return
    setAnswered(true)

    const quality = ACTION_QUALITY[action]
    const existing = reviewRecords[currentCard.id] || null
    const newRecord = calculateNextReview(existing, quality)

    // Update SR record locally
    updateReviewRecord(currentCard.id, newRecord)

    // XP: scale by quality
    const xpMap = { perfect: 15, knew: 10, hard: 5, forgot: 0 }
    const earned = xpMap[action]
    if (earned > 0) { addXP(earned); setSessionXP(s => s + earned) }

    if (action === 'forgot' || action === 'hard') {
      setLives(l => Math.max(0, l - 1))
    }

    setSessionStats(s => ({ ...s, [action]: s[action] + 1 }))

    // Persist to Supabase
    if (user) {
      await supabase.from('sr_records').upsert({
        user_id: user.id,
        card_id: currentCard.id,
        domain_id: domainId,
        ease_factor: newRecord.easeFactor,
        interval: newRecord.interval,
        repetitions: newRecord.repetitions,
        next_review: newRecord.nextReview,
        last_review: newRecord.lastReview,
      }, { onConflict: 'user_id,card_id' })
    }

    // Advance after short delay
    setTimeout(() => {
      setFlipped(false)
      setAnswered(false)
      if (cardIndex + 1 >= sessionCards.length) finishSession(earned)
      else setCardIndex(i => i + 1)
    }, 400)
  }

  const finishSession = async (lastXP) => {
    setCompleted(true)
    setTodayCompleted(true)
    const newStreak = streakDays + 1
    setStreak(newStreak)

    // Achievements
    if (cardIndex === 0) addAchievement(ACHIEVEMENTS.find(a => a.id === 'first_card'))
    if (newStreak >= 3) addAchievement(ACHIEVEMENTS.find(a => a.id === 'streak_3'))
    if (newStreak >= 7) addAchievement(ACHIEVEMENTS.find(a => a.id === 'streak_7'))
    if (newStreak >= 30) addAchievement(ACHIEVEMENTS.find(a => a.id === 'streak_30'))

    const newProgress = Math.min(100, (domainProgress[domainId] || 0) + 10)
    setDomainProgress({ ...domainProgress, [domainId]: newProgress })

    if (user) {
      await supabase.from('profiles').update({
        streak_days: newStreak,
        last_activity_date: new Date().toISOString().split('T')[0],
        domain_progress: { ...domainProgress, [domainId]: newProgress },
      }).eq('id', user.id)

      await supabase.from('activity_log').insert({
        user_id: user.id,
        domain_id: domainId,
        cards_completed: sessionCards.length,
        xp_earned: sessionXP + lastXP,
        created_at: new Date().toISOString(),
      })
    }
  }

  // Load SR records from Supabase on mount
  useEffect(() => {
    if (!user) return
    supabase.from('sr_records').select('*').eq('user_id', user.id).eq('domain_id', domainId)
      .then(({ data }) => {
        if (!data) return
        const map = {}
        data.forEach(r => {
          map[r.card_id] = {
            easeFactor: r.ease_factor,
            interval: r.interval,
            repetitions: r.repetitions,
            nextReview: r.next_review,
            lastReview: r.last_review,
          }
        })
        setReviewRecords({ ...reviewRecords, ...map })
      })
  }, [user, domainId])

  const handleShare = () => {
    const text = `🧠 Just completed a "${domain?.name}" session on Polymath!\n🔥 ${streakDays + 1}-day streak | ⚡ +${sessionXP} XP\n\nhttps://polymath.app`
    if (navigator.share) navigator.share({ text })
    else { navigator.clipboard.writeText(text); toast.success('Copied!') }
  }

  // ── No cards due ──────────────────────────────────────────
  if (sessionCards.length === 0 && !completed) {
    const nextDue = allCards
      .map(c => reviewRecords[c.id]?.nextReview)
      .filter(Boolean)
      .sort()[0]
    const nextDate = nextDue ? new Date(nextDue).toLocaleDateString() : 'tomorrow'

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center max-w-lg mx-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <div className="text-8xl mb-6">🎉</div>
        </motion.div>
        <h2 className="font-display text-3xl text-white mb-3">All caught up!</h2>
        <p className="text-white/50 font-body mb-2">No cards are due in <span className="text-white font-bold">{domain?.name}</span> right now.</p>
        <p className="text-white/40 text-sm font-body mb-8">Your next review is scheduled for <span className="text-primary-400 font-bold">{nextDate}</span></p>
        <div className="card p-4 w-full mb-6 text-left">
          <p className="text-white/60 text-sm font-bold mb-3">📊 Card breakdown</p>
          {allCards.map(c => {
            const m = getCardMaturity(reviewRecords[c.id])
            return (
              <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-white/70 text-sm font-body truncate mr-2">{c.title}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: m.color, backgroundColor: m.color + '20' }}>{m.label}</span>
              </div>
            )
          })}
        </div>
        <button onClick={() => navigate(-1)} className="btn-primary w-full">Back to Domain</button>
      </div>
    )
  }

  // ── Session complete ──────────────────────────────────────
  if (completed) {
    const accuracy = sessionCards.length > 0
      ? Math.round(((sessionStats.perfect + sessionStats.knew) / sessionCards.length) * 100)
      : 0

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-dark-300 max-w-lg mx-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
          <div className="text-8xl mb-4">🎓</div>
        </motion.div>
        <h1 className="font-display text-4xl text-white mb-1">Session Complete!</h1>
        <p className="text-white/50 font-body mb-6">{sessionCards.length} cards reviewed · {accuracy}% accuracy</p>

        <div className="grid grid-cols-2 gap-3 w-full mb-4">
          <div className="card p-4 flex flex-col items-center gap-1">
            <span className="text-2xl">⚡</span>
            <span className="font-display text-xl text-accent-yellow">+{sessionXP}</span>
            <span className="text-white/40 text-xs">XP earned</span>
          </div>
          <div className="card p-4 flex flex-col items-center gap-1">
            <span className="text-2xl">🔥</span>
            <span className="font-display text-xl text-orange-400">{streakDays}</span>
            <span className="text-white/40 text-xs">Day streak</span>
          </div>
        </div>

        {/* SR breakdown */}
        <div className="card p-4 w-full mb-6">
          <p className="text-white/50 text-sm font-bold mb-3 text-left">Answer breakdown</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '⭐ Perfect', val: sessionStats.perfect, color: 'text-accent-yellow' },
              { label: '✅ Knew', val: sessionStats.knew, color: 'text-green-400' },
              { label: '😅 Hard', val: sessionStats.hard, color: 'text-orange-400' },
              { label: '❌ Forgot', val: sessionStats.forgot, color: 'text-red-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className={`font-display text-xl ${color}`}>{val}</span>
                <span className="text-white/30 text-xs text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">Back to Dashboard</button>
          <button onClick={handleShare} className="btn-secondary w-full flex items-center justify-center gap-2">
            <Share2 size={16} /> Share Progress
          </button>
        </div>
      </motion.div>
    )
  }

  // ── Main card UI ──────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-dark-300 max-w-lg mx-auto px-4 pt-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
          <X size={20} />
        </button>
        <div className="flex-1 h-3 rounded-full bg-dark-500 overflow-hidden">
          <motion.div className="h-full rounded-full bg-primary-500"
            animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="flex items-center gap-1">
          {[...Array(3)].map((_, i) => (
            <Heart key={i} size={16} className={i < lives ? 'text-red-400 fill-red-400' : 'text-white/20'} />
          ))}
        </div>
      </div>

      {/* Card counter + maturity */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/40 text-sm font-body">{cardIndex + 1} / {sessionCards.length}</span>
        <div className="flex items-center gap-3">
          {maturity && (
            <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ color: maturity.color, backgroundColor: maturity.color + '20' }}>
              {maturity.label}
            </span>
          )}
          <div className="flex items-center gap-1 text-accent-yellow text-sm font-bold">
            <Zap size={14} /> +{currentCard?.xp || 10}
          </div>
        </div>
      </div>

      {/* Knowledge Card */}
      <AnimatePresence mode="wait">
        <motion.div key={cardIndex}
          initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }} transition={{ duration: 0.22 }}
          className="flex-1"
        >
          <div onClick={() => !answered && setFlipped(!flipped)}
            className="card p-6 cursor-pointer select-none min-h-[400px] flex flex-col relative overflow-hidden transition-all"
            style={{ borderColor: flipped ? (domain?.color + '50') : 'transparent' }}>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">{domain?.emoji}</span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: domain?.color }}>
                {currentCard?.topic}
              </span>
              <span className="ml-auto text-xs text-white/30 font-body capitalize">{currentCard?.difficulty}</span>
            </div>

            <h2 className="font-display text-2xl text-white mb-4 leading-tight">{currentCard?.title}</h2>
            <p className="text-white/80 font-body leading-relaxed text-base flex-1">{currentCard?.content}</p>

            <AnimatePresence>
              {flipped && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-2xl p-4 border"
                  style={{ backgroundColor: domain?.color + '15', borderColor: domain?.color + '30' }}>
                  <p className="text-white/90 font-body text-sm leading-relaxed">{currentCard?.funFact}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!flipped && !answered && (
              <p className="text-white/25 text-sm text-center mt-4">Tap card to reveal fun fact</p>
            )}

            <button onClick={(e) => { e.stopPropagation(); handleShare() }}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors text-white/25 hover:text-white/50">
              <Share2 size={15} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Answer buttons — 4 levels */}
      <div className="mt-4 pb-6">
        <p className="text-white/30 text-xs text-center mb-3 font-body">How well did you know this?</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { action: 'forgot', label: 'Forgot', emoji: '❌', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20 hover:bg-red-400/20' },
            { action: 'hard', label: 'Hard', emoji: '😅', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20 hover:bg-orange-400/20' },
            { action: 'knew', label: 'Got It', emoji: '✅', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20 hover:bg-green-400/20' },
            { action: 'perfect', label: 'Easy!', emoji: '⭐', color: 'text-accent-yellow', bg: 'bg-accent-yellow/10 border-accent-yellow/20 hover:bg-accent-yellow/20' },
          ].map(({ action, label, emoji, color, bg }) => (
            <button key={action} onClick={() => handleAnswer(action)} disabled={answered}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl font-bold border transition-all active:scale-95 disabled:opacity-40 ${bg} ${color}`}>
              <span className="text-xl">{emoji}</span>
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
        {/* Show interval hint */}
        {currentCard && (
          <div className="flex justify-between mt-3 px-1">
            {[
              { label: '~1 day', q: 1 },
              { label: '~2 days', q: 2 },
              { label: '~1 week', q: 4 },
              { label: '~2 weeks', q: 5 },
            ].map(({ label }) => (
              <span key={label} className="text-white/15 text-xs font-body">{label}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
