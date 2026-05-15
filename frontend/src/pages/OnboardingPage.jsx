import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../lib/store'
import { DOMAINS, DIFFICULTY_LEVELS } from '../lib/domains'
import { Check } from 'lucide-react'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, setProfile } = useAuthStore()
  const [step, setStep] = useState(0) // 0=welcome, 1=domains, 2=difficulty
  const [selectedDomains, setSelectedDomains] = useState([])
  const [difficulty, setDifficulty] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleDomain = (id) => {
    setSelectedDomains(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  const handleFinish = async () => {
    if (selectedDomains.length === 0) return toast.error('Please select at least one domain')
    if (!difficulty) return toast.error('Please select your level')
    setLoading(true)

    const profileData = {
      id: user.id,
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Scholar',
      email: user.email,
      selected_domains: selectedDomains,
      difficulty_level: difficulty,
      streak_days: 0,
      total_xp: 0,
      level: 1,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('profiles').upsert(profileData).select().single()
    setLoading(false)
    if (error) return toast.error(error.message)
    setProfile(data)
    toast.success('Welcome to Polymath! 🎉')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col overflow-hidden relative">
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-dark-500">
        <motion.div className="h-full bg-primary-500" animate={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>

      <div className="flex flex-col px-6 pt-12 pb-10 max-w-lg mx-auto w-full flex-1">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="text-8xl mb-6 animate-float">🧪</div>
              <h1 className="font-display text-5xl text-white mb-4">Welcome to<br />Polymath!</h1>
              <p className="text-white/60 font-body text-lg leading-relaxed mb-10">
                You're about to become a multi-domain learner. Let's personalize your experience.
              </p>
              <button onClick={() => setStep(1)} className="btn-primary w-full py-4 text-lg">
                Let's Go! 🚀
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="domains" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <h2 className="font-display text-3xl text-white mb-2">Pick your domains</h2>
              <p className="text-white/50 font-body mb-6">Choose up to 5 domains to start with</p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {DOMAINS.map((domain) => {
                  const selected = selectedDomains.includes(domain.id)
                  return (
                    <button key={domain.id} onClick={() => toggleDomain(domain.id)}
                      className={`domain-card text-left relative overflow-hidden ${selected ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-dark-500'}`}>
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                      <span className="text-3xl block mb-2">{domain.emoji}</span>
                      <p className="font-bold text-white text-sm">{domain.name}</p>
                      <p className="text-white/40 text-xs mt-0.5">{domain.topics.length} topics</p>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => selectedDomains.length > 0 ? setStep(2) : toast.error('Select at least one domain')}
                  className="btn-primary flex-1">
                  Next ({selectedDomains.length}/5)
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="difficulty" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <h2 className="font-display text-3xl text-white mb-2">Your knowledge level</h2>
              <p className="text-white/50 font-body mb-8">This helps us personalize your cards</p>

              <div className="flex flex-col gap-4 mb-8">
                {DIFFICULTY_LEVELS.map((level) => (
                  <button key={level.id} onClick={() => setDifficulty(level.id)}
                    className={`card p-5 text-left flex items-center gap-4 border-2 transition-all ${difficulty === level.id ? 'border-primary-500 bg-primary-500/10' : 'border-transparent'}`}>
                    <span className="text-4xl">{level.emoji}</span>
                    <div>
                      <p className="font-bold text-white text-lg">{level.label}</p>
                      <p className="text-white/50 text-sm font-body">{level.description}</p>
                    </div>
                    {difficulty === level.id && (
                      <div className="ml-auto w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <Check size={14} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={handleFinish} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Setting up...' : "Let's Learn! 🎓"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
