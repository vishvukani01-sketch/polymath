import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAdminStore } from '../../lib/store'
import { Shield } from 'lucide-react'

// Simple admin password gate — replace ADMIN_PASSWORD in your .env
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'polymath-admin-2024'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const { setIsAdmin } = useAdminStore()
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true)
      toast.success('Welcome, Admin!')
      navigate('/admin')
    } else {
      toast.error('Incorrect password')
    }
  }

  return (
    <div className="min-h-screen bg-dark-300 flex items-center justify-center px-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center mb-4">
            <Shield size={28} className="text-primary-400" />
          </div>
          <h1 className="font-display text-3xl text-white">Admin Panel</h1>
          <p className="text-white/40 font-body text-sm mt-1">Polymath Content Manager</p>
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="input-field text-center tracking-widest text-xl" placeholder="••••••••••" autoFocus />
          <button type="submit" className="btn-primary w-full">Enter Admin Panel</button>
        </form>
      </motion.div>
    </div>
  )
}
