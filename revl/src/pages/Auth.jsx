import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  box: { width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '36px 32px' },
  logo: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--accent)', textAlign: 'center', marginBottom: 6, letterSpacing: '-1px' },
  sub: { textAlign: 'center', color: 'var(--muted)', fontSize: 14, marginBottom: 32 },
  tabs: { display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 4, marginBottom: 28 },
  tab: { flex: 1, padding: '10px', textAlign: 'center', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--muted)', border: 'none', background: 'transparent' },
  tabActive: { flex: 1, padding: '10px', textAlign: 'center', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#090909', background: 'var(--accent)', border: 'none' },
  label: { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 },
  input: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '13px 16px', fontSize: 15, color: 'var(--text)', outline: 'none', marginBottom: 16 },
  btn: { width: '100%', padding: 16, background: 'var(--accent)', color: '#090909', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer', marginTop: 4 },
  error: { color: 'var(--red)', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  back: { display: 'block', textAlign: 'center', marginTop: 20, color: 'var(--muted)', fontSize: 13, cursor: 'pointer', textDecoration: 'none' }
}

export default function Auth() {
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { username: username || email.split('@')[0] } }
        })
        if (signUpError) throw signUpError
        navigate('/onboarding')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.box}>
        <div style={s.logo}>REVL</div>
        <div style={s.sub}>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</div>
        <div style={s.tabs}>
          <button style={mode === 'signup' ? s.tabActive : s.tab} onClick={() => setMode('signup')}>Sign Up</button>
          <button style={mode === 'login' ? s.tabActive : s.tab} onClick={() => setMode('login')}>Log In</button>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label style={s.label}>Username</label>
              <input style={s.input} type="text" placeholder="yourname" value={username} onChange={e => setUsername(e.target.value)} required />
            </>
          )}
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Loading...' : mode === 'signup' ? 'Create Account →' : 'Sign In →'}
          </button>
        </form>
        <span style={s.back} onClick={() => navigate('/')}>← Back to home</span>
      </div>
    </div>
  )
}
