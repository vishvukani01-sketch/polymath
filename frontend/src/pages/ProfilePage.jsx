import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuthStore, useProgressStore } from '../lib/store'
import { DOMAINS, getDomainById } from '../lib/domains'
import { Settings, Share2, LogOut, Zap, Flame, Trophy, BookOpen } from 'lucide-react'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, clearAuth } = useAuthStore()
  const { totalXP, streakDays, level, achievements, domainProgress } = useProgressStore()

  const userDomains = profile?.selected_domains || []
  const totalCards = Object.values(domainProgress).reduce((a, b) => a + Math.round(b / 15), 0)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/')
    toast.success('Logged out!')
  }

  const handleShareProfile = () => {
    const text = `🧠 I'm a Level ${level} Polymath with a ${streakDays}-day streak!\n⚡ ${totalXP.toLocaleString()} XP earned\n\nJoin me: https://polymath.app`
    if (navigator.share) navigator.share({ title: 'My Polymath Profile', text })
    else { navigator.clipboard.writeText(text); toast.success('Copied!') }
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
  const item = { hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1 } }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-4">
        
        {/* Avatar & Name */}
        <motion.div variants={item} className="card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-orange-600 flex items-center justify-center font-display text-3xl mb-3 shadow-neon">
            {(profile?.display_name || user?.email || 'P').charAt(0).toUpperCase()}
          </div>
          <h2 className="font-display text-2xl text-white">{profile?.display_name || 'Scholar'}</h2>
          <p className="text-white/40 font-body text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30">
            <span className="text-primary-400 font-bold text-sm">Level {level} Polymath</span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          {[
            { icon: '⚡', val: totalXP.toLocaleString(), label: 'Total XP', color: 'text-accent-yellow' },
            { icon: '🔥', val: streakDays, label: 'Day Streak', color: 'text-orange-400' },
            { icon: '🏆', val: achievements.length, label: 'Achievements', color: 'text-purple-400' },
            { icon: '📚', val: totalCards, label: 'Cards Learned', color: 'text-blue-400' },
          ].map(({ icon, val, label, color }) => (
            <div key={label} className="card p-4 flex flex-col items-center gap-1">
              <span className="text-2xl">{icon}</span>
              <span className={`font-display text-2xl ${color}`}>{val}</span>
              <span className="text-white/40 text-xs font-body">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* Domains */}
        <motion.div variants={item}>
          <h3 className="font-display text-lg text-white mb-3">My Domains</h3>
          <div className="flex flex-wrap gap-2">
            {userDomains.map(id => {
              const d = getDomainById(id)
              return d ? (
                <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                  style={{ backgroundColor: d.color + '20', color: d.color, border: `1px solid ${d.color}30` }}>
                  {d.emoji} {d.name}
                </span>
              ) : null
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div variants={item} className="flex flex-col gap-2">
          <button onClick={() => navigate('/settings')}
            className="card p-4 flex items-center gap-3 hover:border-white/10 transition-all active:scale-98 w-full text-left">
            <Settings size={18} className="text-white/60" />
            <span className="text-white font-bold">Settings</span>
          </button>
          <button onClick={handleShareProfile}
            className="card p-4 flex items-center gap-3 hover:border-white/10 transition-all active:scale-98 w-full text-left">
            <Share2 size={18} className="text-white/60" />
            <span className="text-white font-bold">Share Profile</span>
          </button>
          <button onClick={handleLogout}
            className="card p-4 flex items-center gap-3 hover:border-red-500/20 transition-all active:scale-98 w-full text-left">
            <LogOut size={18} className="text-red-400" />
            <span className="text-red-400 font-bold">Log Out</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
