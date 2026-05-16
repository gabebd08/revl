import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const s = {
  page: { padding: 20, maxWidth: 600, margin: '0 auto' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 24 },
  accent: { color: 'var(--accent)' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 14 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  exName: { fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700 },
  setRow: { display: 'grid', gridTemplateColumns: '40px 1fr 1fr 40px', gap: 8, alignItems: 'center', marginBottom: 8 },
  setNum: { fontSize: 12, color: 'var(--muted)', fontWeight: 600, textAlign: 'center' },
  inp: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text)', width: '100%', textAlign: 'center', outline: 'none' },
  checkBtn: (done) => ({ width: 32, height: 32, borderRadius: '50%', border: done ? 'none' : '1.5px solid var(--border)', background: done ? 'var(--accent)' : 'transparent', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
  addSetBtn: { width: '100%', padding: '8px', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--muted)', fontSize: 13, cursor: 'pointer', marginTop: 4 },
  headerRow: { display: 'grid', gridTemplateColumns: '40px 1fr 1fr 40px', gap: 8, marginBottom: 8 },
  headerLabel: { fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' },
  notesInput: { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text)', outline: 'none', resize: 'vertical', minHeight: 80, marginBottom: 16 },
  saveBtn: { width: '100%', padding: 16, background: 'var(--accent)', color: '#090909', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer' },
  success: { background: '#0f1a00', border: '1px solid var(--accent)', borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16 },
  restDay: { background: '#0f0f0f', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' },
  customEx: { display: 'flex', gap: 8, marginBottom: 14 },
  customInp: { flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text)', outline: 'none' },
  addBtn: { padding: '12px 18px', background: 'var(--accent)', color: '#090909', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14 }
}

export default function LogWorkout() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [exercises, setExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [customEx, setCustomEx] = useState('')
  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

  useEffect(() => {
    supabase.from('profiles').select('plan, weight').eq('id', user.id).single().then(({ data }) => {
      setProfile(data)
      const todayWorkout = data?.plan?.weeklySchedule?.[today]
      if (todayWorkout?.exercises) {
        setExercises(todayWorkout.exercises.map(ex => ({
          name: ex.name,
          targetSets: ex.sets,
          targetReps: ex.reps,
          sets: Array.from({ length: ex.sets }, () => ({ weight: '', reps: '', done: false }))
        })))
      }
    })
  }, [user])

  const updateSet = (exIdx, setIdx, field, val) => {
    setExercises(prev => prev.map((ex, i) => i !== exIdx ? ex : {
      ...ex,
      sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, [field]: val })
    }))
  }

  const toggleDone = (exIdx, setIdx) => {
    setExercises(prev => prev.map((ex, i) => i !== exIdx ? ex : {
      ...ex,
      sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, done: !s.done })
    }))
  }

  const addSet = (exIdx) => {
    setExercises(prev => prev.map((ex, i) => i !== exIdx ? ex : {
      ...ex, sets: [...ex.sets, { weight: '', reps: '', done: false }]
    }))
  }

  const addCustomExercise = () => {
    if (!customEx.trim()) return
    setExercises(prev => [...prev, {
      name: customEx,
      targetSets: 3, targetReps: '8-12',
      sets: [{ weight: '', reps: '', done: false }, { weight: '', reps: '', done: false }, { weight: '', reps: '', done: false }]
    }])
    setCustomEx('')
  }

  async function saveWorkout() {
    const today = new Date().toISOString().split('T')[0]
    const logData = {
      user_id: user.id,
      date: today,
      exercises: exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.filter(s => s.done || s.weight || s.reps)
      })),
      notes,
      created_at: new Date().toISOString()
    }

    await supabase.from('workout_logs').upsert(logData, { onConflict: 'user_id,date' })

    // Update lift PRs
    const liftMap = { 'Back Squat': 'squat', 'Barbell Squat': 'squat', 'Bench Press': 'bench', 'Barbell Bench Press': 'bench', 'Deadlift': 'deadlift', 'Overhead Press': 'ohp', 'OHP': 'ohp' }
    const { data: profileData } = await supabase.from('profiles').select('lifts').eq('id', user.id).single()
    let updatedLifts = { ...profileData?.lifts }
    exercises.forEach(ex => {
      const liftKey = liftMap[ex.name]
      if (liftKey) {
        const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0))
        if (maxWeight > (parseFloat(updatedLifts[liftKey]?.current) || 0)) {
          updatedLifts[liftKey] = { ...updatedLifts[liftKey], current: String(maxWeight) }
        }
      }
    })
    await supabase.from('profiles').update({ lifts: updatedLifts }).eq('id', user.id)
    setSaved(true)
  }

  const todayData = profile?.plan?.weeklySchedule?.[today]
  const isRest = todayData?.type === 'rest'

  if (!profile) return <div style={{ padding: 20, color: 'var(--muted)' }}>Loading...</div>

  return (
    <div style={s.page}>
      <div style={s.title}>Log <span style={s.accent}>Workout</span></div>
      <div style={s.sub}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>

      {saved ? (
        <div style={s.success}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔥</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>Session Logged!</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Your lifts have been recorded. PRs updated automatically.</div>
        </div>
      ) : (
        <>
          {isRest && (
            <div style={s.restDay}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>😴</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>Rest Day</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>But you can still log if you trained.</div>
            </div>
          )}

          {exercises.map((ex, exIdx) => (
            <div key={exIdx} style={s.card}>
              <div style={s.cardHeader}>
                <div style={s.exName}>{ex.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Target: {ex.targetSets}×{ex.targetReps}</div>
              </div>
              <div style={s.headerRow}>
                <div style={s.headerLabel}>Set</div>
                <div style={s.headerLabel}>Weight</div>
                <div style={s.headerLabel}>Reps</div>
                <div style={s.headerLabel}>✓</div>
              </div>
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} style={s.setRow}>
                  <div style={s.setNum}>{setIdx + 1}</div>
                  <input style={s.inp} type="number" placeholder="lbs" value={set.weight} onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value)} />
                  <input style={s.inp} type="number" placeholder="reps" value={set.reps} onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)} />
                  <button style={s.checkBtn(set.done)} onClick={() => toggleDone(exIdx, setIdx)}>{set.done ? '✓' : ''}</button>
                </div>
              ))}
              <button style={s.addSetBtn} onClick={() => addSet(exIdx)}>+ Add Set</button>
            </div>
          ))}

          <div style={s.customEx}>
            <input style={s.customInp} placeholder="Add custom exercise..." value={customEx} onChange={e => setCustomEx(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomExercise()} />
            <button style={s.addBtn} onClick={addCustomExercise}>+</button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Session Notes</label>
            <textarea style={s.notesInput} placeholder="How did it feel? Any PRs? Notes for next time..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <button style={s.saveBtn} onClick={saveWorkout}>Save Session →</button>
        </>
      )}
    </div>
  )
}
