import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'
import { chatWithCoach } from '../lib/claude'

const NAV = [
  { path: '/dashboard', icon: '⚡', label: 'Home' },
  { path: '/schedule', icon: '📅', label: 'Schedule' },
  { path: '/log-workout', icon: '🏋️', label: 'Log' },
  { path: '/progress', icon: '📈', label: 'Progress' },
  { path: '/leaderboard', icon: '🏆', label: 'Board' }
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Hey! I'm REV 🦊 Your AI coach. Ask me anything about your plan — workouts, diet, adjustments. I got you." }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    }
  }, [user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const reply = await chatWithCoach(history, profile?.plan, profile)
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Sorry, I hit an error. Try again!" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 72 }}>
      {children}

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', zIndex: 100, padding: '8px 0 12px' }}>
        {NAV.map(n => {
          const active = location.pathname === n.path
          return (
            <button key={n.path} onClick={() => navigate(n.path)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}>
              <span style={{ fontSize: 20 }}>{n.icon}</span>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? 'var(--accent)' : 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>{n.label}</span>
            </button>
          )
        })}
      </div>

      {/* REV Mascot Button */}
      <button onClick={() => setChatOpen(o => !o)} style={{
        position: 'fixed', bottom: 88, right: 20, width: 52, height: 52,
        background: chatOpen ? 'var(--surface2)' : 'var(--accent)',
        border: chatOpen ? '1.5px solid var(--accent)' : 'none',
        borderRadius: '50%', fontSize: 24, cursor: 'pointer', zIndex: 200,
        boxShadow: '0 4px 20px rgba(200,245,66,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s'
      }}>
        {chatOpen ? '✕' : '🦊'}
      </button>

      {/* Chat Window */}
      {chatOpen && (
        <div style={{
          position: 'fixed', bottom: 152, right: 16, width: 'min(360px, calc(100vw - 32px))',
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20,
          zIndex: 199, display: 'flex', flexDirection: 'column', maxHeight: 480,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🦊</span>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14 }}>REV</div>
              <div style={{ fontSize: 11, color: 'var(--accent)' }}>● Online</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                maxWidth: '85%', padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.5,
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                color: m.role === 'user' ? '#090909' : 'var(--text)',
                fontWeight: m.role === 'user' ? 500 : 400
              }}>{m.content}</div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', background: 'var(--surface2)', padding: '10px 14px', borderRadius: 14, fontSize: 13, color: 'var(--muted)' }}>REV is thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask REV anything..."
              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--text)', outline: 'none' }}
            />
            <button onClick={sendMessage} style={{ padding: '10px 14px', background: 'var(--accent)', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#090909' }}>↑</button>
          </div>
        </div>
      )}
    </div>
  )
}
