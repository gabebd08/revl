import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'

const s = {
  page: { padding: 20, maxWidth: 600, margin: '0 auto' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 24 },
  accent: { color: 'var(--accent)' },
  macroBar: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 },
  macroTitle: { fontSize: 13, color: 'var(--muted)', marginBottom: 12 },
  macroGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  macroStat: { textAlign: 'center' },
  macroVal: (color) => ({ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color }),
  macroLabel: { fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  macroBarTrack: { height: 4, background: 'var(--border)', borderRadius: 100, marginTop: 12 },
  macroBarFill: (pct, color) => ({ height: '100%', background: color, borderRadius: 100, width: Math.min(pct, 100) + '%', transition: 'width 0.4s' }),
  mealCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, marginBottom: 12 },
  mealHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  mealName: { fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700 },
  mealTarget: { fontSize: 12, color: 'var(--muted)' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 },
  inp: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 8px', fontSize: 13, color: 'var(--text)', width: '100%', textAlign: 'center', outline: 'none' },
  label: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' },
  logBtn: (logged) => ({ width: '100%', padding: '10px', background: logged ? '#1a2200' : 'var(--accent)', color: logged ? 'var(--accent)' : '#090909', border: logged ? '1px solid var(--accent)' : 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Syne, sans-serif' }),
  saveBtn: { width: '100%', padding: 16, background: 'var(--accent)', color: '#090909', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer', marginTop: 8 },
  addMealBtn: { width: '100%', padding: 14, background: 'transparent', border: '1px dashed var(--border)', borderRadius: 14, color: 'var(--muted)', fontSize: 14, cursor: 'pointer', marginBottom: 16 }
}

export default function LogMeals() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [meals, setMeals] = useState([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      setProfile(data)
      const today = new Date().toISOString().split('T')[0]
      const { data: log } = await supabase.from('meal_logs').select('*').eq('user_id', user.id).eq('date', today).single()
      if (log) {
        setMeals(log.meals)
        setSaved(false)
      } else if (data?.plan?.meals) {
        setMeals(data.plan.meals.map(m => ({ ...m, logged: false, actual: { calories: '', protein: '', carbs: '', fats: '' } })))
      }
    }
    load()
  }, [user])

  const updateActual = (idx, field, val) => {
    setMeals(prev => prev.map((m, i) => i !== idx ? m : { ...m, actual: { ...m.actual, [field]: val } }))
  }

  const toggleLogged = (idx) => {
    setMeals(prev => prev.map((m, i) => {
      if (i !== idx) return m
      if (!m.logged) {
        return { ...m, logged: true, actual: { calories: String(m.calories), protein: String(m.protein), carbs: String(m.carbs), fats: String(m.fats) } }
      }
      return { ...m, logged: false }
    }))
  }

  const addMeal = () => {
    setMeals(prev => [...prev, { name: 'Extra Meal', calories: 0, protein: 0, carbs: 0, fats: 0, foods: [], logged: false, actual: { calories: '', protein: '', carbs: '', fats: '' } }])
  }

  const totals = meals.reduce((acc, m) => {
    if (m.logged) {
      acc.calories += parseFloat(m.actual.calories) || m.calories || 0
      acc.protein += parseFloat(m.actual.protein) || m.protein || 0
      acc.carbs += parseFloat(m.actual.carbs) || m.carbs || 0
      acc.fats += parseFloat(m.actual.fats) || m.fats || 0
    }
    return acc
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 })

  const targets = { calories: profile?.plan?.dailyCalories || 2000, protein: profile?.plan?.protein || 150, carbs: profile?.plan?.carbs || 200, fats: profile?.plan?.fats || 60 }

  async function saveMeals() {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('meal_logs').upsert({ user_id: user.id, date: today, meals, totals, created_at: new Date().toISOString() }, { onConflict: 'user_id,date' })
    setSaved(true)
  }

  if (!profile) return <div style={{ padding: 20, color: 'var(--muted)' }}>Loading...</div>

  return (
    <div style={s.page}>
      <div style={s.title}>Log <span style={s.accent}>Meals</span></div>
      <div style={s.sub}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>

      <div style={s.macroBar}>
        <div style={s.macroTitle}>Today's progress</div>
        <div style={s.macroGrid}>
          <div style={s.macroStat}><div style={s.macroVal('var(--text)')}>{Math.round(totals.calories)}</div><div style={s.macroLabel}>Cal</div></div>
          <div style={s.macroStat}><div style={s.macroVal('var(--accent)')}>{Math.round(totals.protein)}g</div><div style={s.macroLabel}>Protein</div></div>
          <div style={s.macroStat}><div style={s.macroVal('var(--blue)')}>{Math.round(totals.carbs)}g</div><div style={s.macroLabel}>Carbs</div></div>
          <div style={s.macroStat}><div style={s.macroVal('var(--orange)')}>{Math.round(totals.fats)}g</div><div style={s.macroLabel}>Fats</div></div>
        </div>
        <div style={s.macroBarTrack}><div style={s.macroBarFill((totals.calories / targets.calories) * 100, 'var(--accent)')} /></div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, textAlign: 'right' }}>{Math.round(totals.calories)} / {targets.calories} cal</div>
      </div>

      {meals.map((meal, idx) => (
        <div key={idx} style={s.mealCard}>
          <div style={s.mealHeader}>
            <div>
              <div style={s.mealName}>{meal.name}</div>
              <div style={s.mealTarget}>Target: {meal.calories} cal · P:{meal.protein}g C:{meal.carbs}g F:{meal.fats}g</div>
            </div>
          </div>
          {meal.foods?.length > 0 && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>{meal.foods.join(' · ')}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
            {['calories', 'protein', 'carbs', 'fats'].map(f => (
              <div key={f}><div style={s.label}>{f === 'calories' ? 'Cal' : f.charAt(0).toUpperCase() + f.slice(1)}</div><input style={s.inp} type="number" placeholder={String(meal[f])} value={meal.actual[f]} onChange={e => updateActual(idx, f, e.target.value)} /></div>
            ))}
          </div>
          <button style={s.logBtn(meal.logged)} onClick={() => toggleLogged(idx)}>
            {meal.logged ? '✓ Logged' : 'Log This Meal'}
          </button>
        </div>
      ))}

      <button style={s.addMealBtn} onClick={addMeal}>+ Add Extra Meal</button>
      {saved && <div style={{ background: '#0f1a00', border: '1px solid var(--accent)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>✓ Meals saved for today</div>}
      <button style={s.saveBtn} onClick={saveMeals}>Save Today's Nutrition →</button>
    </div>
  )
}
