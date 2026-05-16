import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }
const TODAY = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

const s = {
  page: { padding: '20px', maxWidth: 600, margin: '0 auto' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 24 },
  accent: { color: 'var(--accent)' },
  dayTabs: { display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 },
  dayTab: (active, isToday) => ({
    flexShrink: 0, padding: '8px 14px', borderRadius: 10, cursor: 'pointer', border: 'none',
    background: active ? 'var(--accent)' : isToday ? '#1a2200' : 'var(--surface)',
    color: active ? '#090909' : isToday ? 'var(--accent)' : 'var(--muted)',
    fontFamily: 'Syne, sans-serif', fontWeight: active ? 700 : 500, fontSize: 13,
    borderBottom: isToday && !active ? '2px solid var(--accent)' : 'none',
    transition: 'all 0.2s'
  }),
  workoutCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  focusTitle: { fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800 },
  typeBadge: (isRest) => ({ display: 'inline-block', background: isRest ? '#1a1a1a' : '#1a2200', color: isRest ? 'var(--muted)' : 'var(--accent)', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 1 }),
  exTable: { width: '100%', borderCollapse: 'collapse' },
  th: { fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 0 10px', textAlign: 'left', fontWeight: 600 },
  thRight: { fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 0 10px', textAlign: 'right', fontWeight: 600 },
  tr: { borderTop: '1px solid var(--border)' },
  td: { padding: '10px 0', fontSize: 13 },
  tdRight: { padding: '10px 0', fontSize: 12, color: 'var(--muted)', textAlign: 'right' },
  restCard: { background: '#0f0f0f', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' },
  restIcon: { fontSize: 48, marginBottom: 12 },
  restTitle: { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--accent)', marginBottom: 6 },
  restSub: { fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 },
  mealSection: { marginTop: 24 },
  sectionTitle: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 12 },
  mealCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', marginBottom: 10 },
  mealHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  mealName: { fontWeight: 600, fontSize: 14 },
  mealCals: { fontSize: 12, color: 'var(--accent)', fontWeight: 600 },
  mealFoods: { fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 8 },
  macroPills: { display: 'flex', gap: 6 },
  macroPill: (color) => ({ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: color + '22', color }),
}

export default function Schedule() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [selectedDay, setSelectedDay] = useState(TODAY)

  useEffect(() => {
    supabase.from('profiles').select('plan, meals_per_day').eq('id', user.id).single().then(({ data }) => setProfile(data))
  }, [user])

  if (!profile) return <div style={{ padding: 20, color: 'var(--muted)', textAlign: 'center', marginTop: 40 }}>Loading schedule...</div>

  const plan = profile.plan
  const dayData = plan?.weeklySchedule?.[selectedDay]
  const isRest = !dayData || dayData.type === 'rest'

  return (
    <div style={s.page}>
      <div style={s.title}>Weekly <span style={s.accent}>Schedule</span></div>
      <div style={s.sub}>Your full week, planned out.</div>

      <div style={s.dayTabs}>
        {DAYS.map(d => (
          <button key={d} style={s.dayTab(selectedDay === d, d === TODAY)} onClick={() => setSelectedDay(d)}>
            {DAY_LABELS[d]}
            {d === TODAY && <span style={{ display: 'block', fontSize: 9, color: selectedDay === d ? '#090909' : 'var(--accent)' }}>TODAY</span>}
          </button>
        ))}
      </div>

      {isRest ? (
        <div style={s.restCard}>
          <div style={s.restIcon}>😴</div>
          <div style={s.restTitle}>Rest Day</div>
          <div style={s.restSub}>Your muscles grow when you rest. Stay hydrated, hit your protein, and let your body recover.</div>
        </div>
      ) : (
        <div style={s.workoutCard}>
          <div style={s.cardHeader}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</div>
              <div style={s.focusTitle}>{dayData?.focus || 'Training Day'}</div>
            </div>
            <div style={s.typeBadge(false)}>🔥 Training</div>
          </div>
          <table style={s.exTable}>
            <thead>
              <tr>
                <th style={s.th}>Exercise</th>
                <th style={s.thRight}>Sets × Reps</th>
                <th style={s.thRight}>Rest</th>
              </tr>
            </thead>
            <tbody>
              {dayData?.exercises?.map((ex, i) => (
                <tr key={i} style={s.tr}>
                  <td style={s.td}>{ex.name}</td>
                  <td style={s.tdRight}>{ex.sets}×{ex.reps}</td>
                  <td style={s.tdRight}>{ex.rest || '60s'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {plan?.meals && (
        <div style={s.mealSection}>
          <div style={s.sectionTitle}>Today's Meals</div>
          {plan.meals.map((meal, i) => (
            <div key={i} style={s.mealCard}>
              <div style={s.mealHeader}>
                <div style={s.mealName}>{meal.name}</div>
                <div style={s.mealCals}>{meal.calories} cal</div>
              </div>
              <div style={s.mealFoods}>{meal.foods?.join(' · ')}</div>
              <div style={s.macroPills}>
                <span style={s.macroPill('var(--accent)')}>P: {meal.protein}g</span>
                <span style={s.macroPill('var(--blue)')}>C: {meal.carbs}g</span>
                <span style={s.macroPill('var(--orange)')}>F: {meal.fats}g</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
