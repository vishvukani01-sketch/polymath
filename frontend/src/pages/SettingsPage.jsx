import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuthStore, useProgressStore } from '../lib/store'
import { DOMAINS, DIFFICULTY_LEVELS } from '../lib/domains'
import { ChevronLeft, Check, Bell, Moon, Globe } from 'lucide-react'

export default function SettingsPage() {
  const { user, profile, setProfile } = useAuthStore()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [selectedDomains, setSelectedDomains] = useState(profile?.selected_domains || [])
  const [difficulty, setDifficulty] = useState(profile?.difficulty_level || 'beginner')
  const [reminderEnabled, setReminderEnabled] = useState(profile?.reminder_enabled || false)
  const [weeklyDigest, setWeeklyDigest] = useState(profile?.weekly_digest || false)
  const [saving, setSaving] = useState(false)

  const toggleDomain = (id) => {
    setSelectedDomains(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : prev.length < 5 ? [...prev, id] : prev
    )
  }

  const handleSave = async () => {
    if (!displayName.trim()) return toast.error('Display name cannot be empty')
    setSaving(true)
    const updates = { display_name: displayName, selected_domains: selectedDomains, difficulty_level: difficulty, reminder_enabled: reminderEnabled, weekly_digest: weeklyDigest }
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()
    setSaving(false)
    if (error) return toast.error(error.message)
    setProfile(data)
    toast.success('Settings saved!')
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
  const item = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1 } }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">

        {/* Display name */}
        <motion.div variants={item}>
          <h3 className="font-display text-lg text-white mb-3">Display Name</h3>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
            className="input-field" placeholder="Your name" />
        </motion.div>

        {/* Difficulty */}
        <motion.div variants={item}>
          <h3 className="font-display text-lg text-white mb-3">Learning Level</h3>
          <div className="flex flex-col gap-2">
            {DIFFICULTY_LEVELS.map(lvl => (
              <button key={lvl.id} onClick={() => setDifficulty(lvl.id)}
                className={`card p-4 flex items-center gap-3 border-2 transition-all text-left ${difficulty === lvl.id ? 'border-primary-500 bg-primary-500/10' : 'border-transparent'}`}>
                <span className="text-2xl">{lvl.emoji}</span>
                <div>
                  <p className="font-bold text-white text-sm">{lvl.label}</p>
                  <p className="text-white/40 text-xs font-body">{lvl.description}</p>
                </div>
                {difficulty === lvl.id && <Check size={16} className="text-primary-400 ml-auto" />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Domains */}
        <motion.div variants={item}>
          <h3 className="font-display text-lg text-white mb-1">Your Domains</h3>
          <p className="text-white/40 text-sm font-body mb-3">Choose up to 5 domains</p>
          <div className="grid grid-cols-2 gap-2">
            {DOMAINS.map(d => {
              const selected = selectedDomains.includes(d.id)
              return (
                <button key={d.id} onClick={() => toggleDomain(d.id)}
                  className={`card p-3 flex items-center gap-2 border-2 transition-all text-left ${selected ? 'border-primary-500 bg-primary-500/10' : 'border-transparent'}`}>
                  <span className="text-xl">{d.emoji}</span>
                  <span className="text-white text-sm font-bold">{d.name}</span>
                  {selected && <Check size={12} className="text-primary-400 ml-auto" />}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={item}>
          <h3 className="font-display text-lg text-white mb-3">Notifications</h3>
          <div className="flex flex-col gap-2">
            {[
              { key: 'reminder', icon: Bell, label: 'Daily Reminder', desc: 'Remind me to learn each day', val: reminderEnabled, set: setReminderEnabled },
              { key: 'digest', icon: Globe, label: 'Weekly Digest', desc: 'Weekly email of what you learned', val: weeklyDigest, set: setWeeklyDigest },
            ].map(({ key, icon: Icon, label, desc, val, set }) => (
              <div key={key} className="card p-4 flex items-center gap-3">
                <Icon size={18} className="text-white/60" />
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">{label}</p>
                  <p className="text-white/40 text-xs font-body">{desc}</p>
                </div>
                <button onClick={() => set(!val)}
                  className={`w-12 h-6 rounded-full transition-all relative ${val ? 'bg-primary-500' : 'bg-dark-600'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${val ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item}>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-4">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
