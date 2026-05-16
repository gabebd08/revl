import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'

const s = {
  page: { padding: '20px 20px 0', maxWidth: 600, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  logo: { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--accent)' },
  avatar: { width: 38, height: 38, borderRadius: '50%', background: '#1a2200', border: '1.5px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--accent)', fontSize: 14, cursor: 'pointer' },
  greeting: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 },
  greetingSub: { fontSize: 14, color: 'var(--muted)', marginBottom: 24 },
  accent: { color: 'var(--accent)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 },
  stat: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 12px', textAlign: 'center' },
  statVal: { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--accent)' },
  statLabel: { fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 },
  section: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 12, marginTop: 20 },
  planCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 },
  badge: { display: 'inline-block', background: '#1a2200', color: 'var(--accent)', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  planTitle: { fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 6 },
  planSub: { fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 },
  macroRow: { display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  macroPill: (color) => ({ padding: '6px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: color + '22', color: color }),
  todayCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 },
  todayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  todayTitle: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 },
  focus: { fontSize: 12, color: 'var(--accent)', fontWeight: 600 },
  exList: { listStyle: 'none' },
  exItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 },
  exSets: { color: 'var(--muted)', fontSize: 12 },
  restCard: { background: '#0f1a00', border: '1px solid var(--accent)22', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 16 },
  quickActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 },
  actionBtn: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 14px', cursor: 'pointer', textAlign: 'left' },
  actionIcon: { fontSize: 22, marginBottom: 8, display: 'block' },
  actionTitle: { fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, marginBottom: 2 },
  actionSub: { fontSize: 12, color: 'var(--muted)' }
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayLog, setTodayLog] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data && !data.onboarded) { navigate('/onboarding'); return }
      setProfile(data)
      const today = new Date().toISOString().split('T')[0]
      const { data: log } = await supabase.from('workout_logs').select('*').eq('user_id', user.id).eq('date', today).single()
      setTodayLog(log)
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--muted)' }}>Loading...</div>
  if (!profile) return null

  const plan = profile.plan
  const todayName = DAYS[new Date().getDay()]
  const todayWorkout = plan?.weeklySchedule?.[todayName]
  const username = profile.username || 'Athlete'
  const initials = username.slice(0, 2).toUpperCase()

  const quickActions = [
    { icon: '🏋️', title: 'Log Workout', sub: 'Track today\'s session', path: '/log-workout' },
    { icon: '🥗', title: 'Log Meals', sub: 'Track your nutrition', path: '/log-meals' },
    { icon: '📈', title: 'Progress', sub: 'View your journey', path: '/progress' },
    { icon: '💪', title: 'Strength Rank', sub: 'See where you stand', path: '/strength' }
  ]

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.logo}>REVL</div>
        <div style={s.avatar} onClick={async () => { await supabase.auth.signOut(); navigate('/') }}>{initials}</div>
      </div>

      <div style={s.greeting}>
        Hey, <span style={s.accent}>{username}.</span>
      </div>
      <div style={s.greetingSub}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>

      <div style={s.statsGrid}>
        <div style={s.stat}><div style={s.statVal}>{plan?.dailyCalories?.toLocaleString() || '—'}</div><div style={s.statLabel}>Daily Cal</div></div>
        <div style={s.stat}><div style={s.statVal}>{plan?.protein || '—'}g</div><div style={s.statLabel}>Protein</div></div>
        <div style={s.stat}><div style={s.statVal}>{profile.training_days?.split(' ')[0] || '—'}</div><div style={s.statLabel}>Days/wk</div></div>
      </div>

      <div style={s.section}>Today's Workout</div>
      {todayWorkout?.type === 'rest' ? (
        <div style={s.restCard}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>😴</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>Rest Day</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Recovery is part of the process. Eat your protein.</div>
        </div>
      ) : todayWorkout ? (
        <div style={s.todayCard}>
          <div style={s.todayHeader}>
            <div style={s.todayTitle}>{todayWorkout.focus}</div>
            <div style={s.focus}>{todayWorkout.type === 'workout' ? '🔥 Training' : 'Rest'}</div>
          </div>
          <ul style={s.exList}>
            {todayWorkout.exercises?.slice(0, 5).map((ex, i) => (
              <li key={i} style={s.exItem}>
                <span>{ex.name}</span>
                <span style={s.exSets}>{ex.sets}×{ex.reps}</span>
              </li>
            ))}
          </ul>
          {!todayLog && (
            <button onClick={() => navigate('/log-workout')} style={{ width: '100%', marginTop: 14, padding: '12px', background: 'var(--accent)', border: 'none', borderRadius: 10, fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#090909', cursor: 'pointer' }}>
              Start Session →
            </button>
          )}
          {todayLog && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>✓ Session logged</div>}
        </div>
      ) : (
        <div style={s.todayCard}><div style={{ color: 'var(--muted)', fontSize: 14 }}>No plan loaded. Complete onboarding to get your schedule.</div></div>
      )}

      {plan && (
        <>
          <div style={s.section}>Your Program</div>
          <div style={s.planCard}>
            <div style={s.badge}>{plan.phase?.toUpperCase() || 'PROGRAM'}</div>
            <div style={s.planTitle}>
              {plan.phase === 'bulk' ? 'Muscle Building Program' :
               plan.phase === 'cut' ? 'Fat Loss Program' :
               plan.phase === 'recomp' ? 'Body Recomp Program' : 'Maintenance Program'}
            </div>
            <div style={s.planSub}>{plan.summary}</div>
            <div style={s.macroRow}>
              <span style={s.macroPill('var(--accent)')}>P: {plan.protein}g</span>
              <span style={s.macroPill('var(--blue)')}>C: {plan.carbs}g</span>
              <span style={s.macroPill('var(--orange)')}>F: {plan.fats}g</span>
            </div>
          </div>
        </>
      )}

      <div style={s.section}>Quick Actions</div>
      <div style={s.quickActions}>
        {quickActions.map(a => (
          <button key={a.path} style={s.actionBtn} onClick={() => navigate(a.path)}>
            <span style={s.actionIcon}>{a.icon}</span>
            <div style={s.actionTitle}>{a.title}</div>
            <div style={s.actionSub}>{a.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
