import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('email') // 'email' | 'otp'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill all fields')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success('Welcome back!')
    navigate('/dashboard')
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${polymath-pi.vercel.app}/dashboard` }
    })
    if (error) toast.error(error.message)
  }

  const handleAppleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary-500/8 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col px-6 pt-12 pb-10 max-w-lg mx-auto w-full flex-1">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/50 mb-8 hover:text-white transition-colors w-fit">
          <ArrowLeft size={18} /> Back
        </button>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="mb-8">
            <h1 className="font-display text-4xl text-white mb-2">Welcome back</h1>
            <p className="text-white/50 font-body">Continue your learning journey</p>
          </div>

          {/* Social buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button onClick={handleGoogleLogin} className="btn-secondary flex items-center justify-center gap-3 w-full">
              <span className="text-xl">🌐</span> Continue with Google
            </button>
            <button onClick={handleAppleLogin} className="btn-secondary flex items-center justify-center gap-3 w-full">
              <span className="text-xl">🍎</span> Continue with Apple
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-sm font-body">or email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-white/60 text-sm font-bold mb-2 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="text-white/60 text-sm font-bold mb-2 block">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12" placeholder="••••••••" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-white/40 mt-6 font-body">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-400 font-bold hover:text-primary-300 transition-colors">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
