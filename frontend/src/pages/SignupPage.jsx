import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('form') // 'form' | 'verify'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all fields')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { display_name: form.name } }
    })
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success('Verification code sent to your email!')
    setStep('verify')
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp || otp.length < 6) return toast.error('Enter the 6-digit code')
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email: form.email,
      token: otp,
      type: 'signup',
    })
    setLoading(false)
    if (error) return toast.error(error.message)
    toast.success('Email verified! Welcome to Polymath 🎉')
    navigate('/onboarding')
  }

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` }
    })
    if (error) toast.error(error.message)
  }

  const handleAppleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/onboarding` }
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="min-h-screen bg-dark-300 flex flex-col relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-accent-yellow/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col px-6 pt-12 pb-10 max-w-lg mx-auto w-full flex-1">
        <button onClick={() => step === 'verify' ? setStep('form') : navigate('/')}
          className="flex items-center gap-2 text-white/50 mb-8 hover:text-white transition-colors w-fit">
          <ArrowLeft size={18} /> Back
        </button>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} key={step}>
          {step === 'form' ? (
            <>
              <div className="mb-8">
                <h1 className="font-display text-4xl text-white mb-2">Create account</h1>
                <p className="text-white/50 font-body">Start your polymath journey today</p>
              </div>

              <div className="flex flex-col gap-3 mb-6">
                <button onClick={handleGoogleSignup} className="btn-secondary flex items-center justify-center gap-3 w-full">
                  <span className="text-xl">🌐</span> Continue with Google
                </button>
                <button onClick={handleAppleSignup} className="btn-secondary flex items-center justify-center gap-3 w-full">
                  <span className="text-xl">🍎</span> Continue with Apple
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-sm font-body">or email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div>
                  <label className="text-white/60 text-sm font-bold mb-2 block">Your Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="input-field" placeholder="Ada Lovelace" autoComplete="name" />
                </div>
                <div>
                  <label className="text-white/60 text-sm font-bold mb-2 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="input-field" placeholder="you@example.com" autoComplete="email" />
                </div>
                <div>
                  <label className="text-white/60 text-sm font-bold mb-2 block">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      className="input-field pr-12" placeholder="Min. 6 characters" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-white/40 mt-6 font-body">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-400 font-bold hover:text-primary-300 transition-colors">Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="text-6xl mb-4">📧</div>
                <h1 className="font-display text-4xl text-white mb-2">Check your email</h1>
                <p className="text-white/50 font-body">
                  We sent a 6-digit code to <span className="text-white font-bold">{form.email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div>
                  <label className="text-white/60 text-sm font-bold mb-2 block">Verification Code</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field text-center text-2xl font-mono tracking-widest" placeholder="000000"
                    maxLength={6} inputMode="numeric" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Verifying...' : 'Verify Email ✓'}
                </button>
              </form>

              <button onClick={() => handleSignup({ preventDefault: () => {} })}
                className="text-center text-primary-400 font-bold mt-4 w-full hover:text-primary-300 transition-colors">
                Resend code
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
