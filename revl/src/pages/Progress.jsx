import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const s = {
  page: { padding: 20, maxWidth: 600, margin: '0 auto' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 24 },
  accent: { color: 'var(--accent)' },
  section: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 12, marginTop: 24 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 },
  streakRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 },
  streakStat: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' },
  streakVal: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: 'var(--accent)' },
  streakLabel: { fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 20 },
  weekDay: (done) => ({ aspectRatio: '1', borderRadius: 8, background: done ? 'var(--accent)' : 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: done ? '#090909' : 'var(--muted)', fontWeight: done ? 700 : 400 }),
  logRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13 },
  logDate: { color: 'var(--muted)', fontSize: 12 },
  logExCount: { color: 'var(--accent)', fontSize: 12, fontWeight: 600 },
  checkInSection: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 },
  checkInTitle: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 6 },
  checkInSub: { fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 },
  photoRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 },
  photoUpload: { border: '1.5px dashed var(--border)', borderRadius: 12, padding: 16, textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' },
  photoLabel: { fontSize: 12, color: 'var(--muted)', marginTop: 6 },
  preview: { width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 },
  submitBtn: { width: '100%', padding: 14, background: 'var(--accent)', color: '#090909', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, fontFamily: 'Syne, sans-serif', cursor: 'pointer' },
  weightInp: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: 'var(--text)', width: '100%', outline: 'none', marginBottom: 14 }
}

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Progress() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [profile, setProfile] = useState(null)
  const [newWeight, setNewWeight] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [checkInSaved, setCheckInSaved] = useState(false)
  const [weightHistory, setWeightHistory] = useState([])

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: wLogs } = await supabase.from('workout_logs').select('date, exercises').eq('user_id', user.id).order('date', { ascending: false }).limit(30)
      setLogs(wLogs || [])
      const { data: wHistory } = await supabase.from('weight_logs').select('date, weight').eq('user_id', user.id).order('date', { ascending: true }).limit(20)
      setWeightHistory(wHistory || [])
    }
    load()
  }, [user])

  const thisWeek = (() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  })()

  const loggedDates = new Set(logs.map(l => l.date))
  const weekStreak = thisWeek.filter(d => loggedDates.has(d)).length
  const totalSessions = logs.length

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function saveCheckIn() {
    const today = new Date().toISOString().split('T')[0]
    if (newWeight) {
      await supabase.from('weight_logs').upsert({ user_id: user.id, date: today, weight: parseFloat(newWeight) }, { onConflict: 'user_id,date' })
      await supabase.from('profiles').update({ weight: parseFloat(newWeight) }).eq('id', user.id)
      setWeightHistory(prev => [...prev, { date: today, weight: parseFloat(newWeight) }])
    }
    setCheckInSaved(true)
    setNewWeight('')
  }

  const chartData = weightHistory.map(w => ({ date: w.date.slice(5), weight: w.weight }))

  return (
    <div style={s.page}>
      <div style={s.title}>Your <span style={s.accent}>Progress</span></div>
      <div style={s.sub}>Every rep logged. Every pound tracked.</div>

      <div style={s.streakRow}>
        <div style={s.streakStat}><div style={s.streakVal}>{weekStreak}</div><div style={s.streakLabel}>This Week</div></div>
        <div style={s.streakStat}><div style={s.streakVal}>{totalSessions}</div><div style={s.streakLabel}>Total Sessions</div></div>
        <div style={s.streakStat}><div style={s.streakVal}>{profile?.weight || '—'}</div><div style={s.streakLabel}>Current lbs</div></div>
      </div>

      <div style={s.section}>This Week</div>
      <div style={s.weekGrid}>
        {thisWeek.map((d, i) => (
          <div key={d} style={s.weekDay(loggedDates.has(d))}>
            <div style={{ textAlign: 'center' }}>
              <div>{WEEK_LABELS[i]}</div>
              {loggedDates.has(d) && <div>✓</div>}
            </div>
          </div>
        ))}
      </div>

      {chartData.length > 1 && (
        <>
          <div style={s.section}>Weight Over Time</div>
          <div style={s.card}>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252525" />
                <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#666', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="weight" stroke="#c8f542" strokeWidth={2} dot={{ fill: '#c8f542', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div style={s.section}>Check-in</div>
      <div style={s.checkInSection}>
        <div style={s.checkInTitle}>Log Today's Weight</div>
        <div style={s.checkInSub}>Track your weight consistently to see trends. Same time of day works best.</div>
        <input style={s.weightInp} type="number" placeholder={`Current: ${profile?.weight || '—'} lbs`} value={newWeight} onChange={e => setNewWeight(e.target.value)} />
        <div style={s.checkInTitle}>Progress Photo</div>
        <div style={{ ...s.checkInSub, marginTop: 4 }}>Optional — same pose, same time of day.</div>
        <div style={s.photoUpload}>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
          {photoPreview ? <img src={photoPreview} style={s.preview} alt="progress" /> : <div style={{ fontSize: 24, marginBottom: 6 }}>📸</div>}
          <div style={s.photoLabel}>{photoPreview ? '✓ Photo ready' : 'Upload progress photo'}</div>
        </div>
        {checkInSaved && <div style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✓ Check-in saved</div>}
        <button style={s.submitBtn} onClick={saveCheckIn}>Save Check-in →</button>
      </div>

      {logs.length > 0 && (
        <>
          <div style={s.section}>Recent Sessions</div>
          <div style={s.card}>
            {logs.slice(0, 10).map((log, i) => (
              <div key={i} style={s.logRow}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                </div>
                <div style={s.logExCount}>{log.exercises?.length || 0} exercises</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
