import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'
import { generatePlan } from '../lib/claude'

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)' },
  logo: { fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--accent)' },
  stepTxt: { fontSize: 13, color: 'var(--muted)' },
  bar: { height: 2, background: 'var(--border)' },
  fill: (pct) => ({ height: '100%', background: 'var(--accent)', width: pct + '%', transition: 'width 0.4s ease' }),
  body: { flex: 1, maxWidth: 520, margin: '0 auto', width: '100%', padding: '36px 24px' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 6, lineHeight: 1.15 },
  titleAccent: { color: 'var(--accent)' },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.6 },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 },
  input: { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 16px', fontSize: 15, color: 'var(--text)', outline: 'none', marginBottom: 16 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  fg: { marginBottom: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 },
  pill: (sel) => ({
    padding: '14px 12px', background: sel ? '#1a2200' : 'var(--surface)',
    border: sel ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
    borderRadius: 12, textAlign: 'center', cursor: 'pointer',
    fontSize: 14, fontWeight: 500, color: sel ? 'var(--accent)' : 'var(--text)',
    transition: 'all 0.2s'
  }),
  pillIcon: { fontSize: 22, marginBottom: 6, display: 'block' },
  allergies: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag: (sel) => ({
    padding: '8px 14px', background: sel ? '#220000' : 'var(--surface)',
    border: sel ? '1.5px solid var(--red)' : '1.5px solid var(--border)',
    borderRadius: 100, fontSize: 13, cursor: 'pointer', fontWeight: 500,
    color: sel ? 'var(--red)' : 'var(--text)', transition: 'all 0.2s'
  }),
  liftTable: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 20 },
  liftRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10, alignItems: 'center' },
  liftLabel: { fontSize: 13, color: 'var(--muted)', fontWeight: 500 },
  liftInput: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: 'var(--text)', width: '100%', textAlign: 'center', outline: 'none' },
  upload: { border: '1.5px dashed var(--border)', borderRadius: 16, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', marginBottom: 14 },
  uploadIcon: { fontSize: 32, marginBottom: 10 },
  uploadTitle: { fontSize: 14, fontWeight: 500, marginBottom: 4 },
  uploadSub: { fontSize: 12, color: 'var(--muted)' },
  preview: { width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginTop: 10 },
  btnPrimary: { width: '100%', padding: 16, background: 'var(--accent)', color: '#090909', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer', marginTop: 8 },
  btnSecondary: { width: '100%', padding: 13, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 14, fontSize: 14, cursor: 'pointer', marginTop: 8 },
  genWrapper: { textAlign: 'center', padding: '40px 20px' },
  spinner: { width: 64, height: 64, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' },
  genTitle: { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, marginBottom: 8 },
  genSub: { fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 },
  genStep: (done, active) => ({
    padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 8,
    display: 'flex', alignItems: 'center', gap: 10,
    background: done ? '#0f1a00' : active ? 'var(--surface)' : 'transparent',
    color: done ? 'var(--accent)' : active ? 'var(--text)' : 'var(--muted)'
  })
}

const GOALS = [
  { icon: '💪', label: 'Build Muscle' },
  { icon: '🔥', label: 'Lose Fat' },
  { icon: '⚡', label: 'Recomp' },
  { icon: '🏋️', label: 'Get Stronger' },
  { icon: '🏃', label: 'Endurance' },
  { icon: '⚖️', label: 'Maintain' }
]
const DIET_TYPES = [
  { icon: '🥩', label: 'No restrictions' },
  { icon: '🥗', label: 'Vegetarian' },
  { icon: '🌱', label: 'Vegan' },
  { icon: '🫀', label: 'Keto' }
]
const ALLERGIES = ['🥜 Peanuts', '🌾 Gluten', '🥛 Dairy', '🥚 Eggs', '🐟 Fish', '🦐 Shellfish', '🌰 Tree Nuts', '🫘 Soy']
const GEN_STEPS = ['📸 Analyzing physique inputs', '🧬 Assessing body composition', '🏋️ Designing your workout split', '🥗 Calculating macros and meals', '⚡ Finalizing your program']

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [genStep, setGenStep] = useState(-1)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '', age: '', sex: '', height: '', weight: '', targetWeight: '',
    goal: '', experience: '', trainingDays: '',
    lifts: { squat: { current: '', target: '' }, bench: { current: '', target: '' }, deadlift: { current: '', target: '' }, ohp: { current: '', target: '' }, pullup: { current: '', target: '' } },
    currentPhoto: null, dreamPhoto: null, currentPhotoPreview: null, dreamPhotoPreview: null,
    dietType: '', allergies: [], mealsPerDay: '3 meals + snacks'
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const setLift = (lift, field, val) => setForm(f => ({ ...f, lifts: { ...f.lifts, [lift]: { ...f.lifts[lift], [field]: val } } }))
  const toggleAllergy = (a) => setForm(f => ({ ...f, allergies: f.allergies.includes(a) ? f.allergies.filter(x => x !== a) : [...f.allergies, a] }))

  const handlePhoto = (e, type) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      if (type === 'current') setForm(f => ({ ...f, currentPhoto: file, currentPhotoPreview: ev.target.result }))
      else setForm(f => ({ ...f, dreamPhoto: file, dreamPhotoPreview: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  async function handleGenerate() {
    setStep(6)
    setError('')
    let i = 0
    const interval = setInterval(() => {
      setGenStep(i)
      i++
      if (i >= GEN_STEPS.length) clearInterval(interval)
    }, 800)

    try {
      const plan = await generatePlan(form)
      if (!plan) throw new Error('Plan generation failed')

      const { error: dbError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: form.name || user.email?.split('@')[0],
        email: user.email,
        age: parseInt(form.age),
        sex: form.sex,
        height: form.height,
        weight: parseFloat(form.weight),
        target_weight: parseFloat(form.targetWeight),
        goal: form.goal,
        experience: form.experience,
        training_days: form.trainingDays,
        lifts: form.lifts,
        diet_type: form.dietType,
        allergies: form.allergies,
        meals_per_day: form.mealsPerDay,
        plan: plan,
        onboarded: true,
        created_at: new Date().toISOString()
      })
      if (dbError) throw dbError

      setTimeout(() => navigate('/dashboard'), 1000)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setStep(5)
    }
  }

  const pct = Math.round((step / 6) * 100)

  if (step === 6) return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={s.topbar}>
        <div style={s.logo}>REVL</div>
        <div style={s.stepTxt}>Building your plan...</div>
      </div>
      <div style={{ height: 2, background: 'var(--border)' }}><div style={s.fill(100)} /></div>
      <div style={s.body}>
        <div style={s.genWrapper}>
          <div style={s.spinner} />
          <div style={s.genTitle}>Building your plan...</div>
          <div style={s.genSub}>AI is analyzing your inputs and creating a fully personalized program.</div>
          {GEN_STEPS.map((gs, i) => (
            <div key={i} style={s.genStep(genStep > i, genStep === i)}>{gs}</div>
          ))}
          {error && <div style={{ color: 'var(--red)', marginTop: 16, fontSize: 14 }}>{error}</div>}
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } input:focus, select:focus { border-color: var(--accent) !important; }`}</style>
      <div style={s.topbar}>
        <div style={s.logo}>REVL</div>
        <div style={s.stepTxt}>{step}/5 — {['', 'Basics', 'Goals', 'Lifts', 'Photos', 'Diet'][step]}</div>
      </div>
      <div style={{ height: 2, background: 'var(--border)' }}><div style={s.fill(pct)} /></div>
      <div style={s.body}>

        {step === 1 && <>
          <div style={s.title}>Let's start with <span style={s.titleAccent}>you.</span></div>
          <div style={s.sub}>Basic stats to calibrate your plan.</div>
          <div style={s.fg}><label style={s.label}>Name</label><input style={s.input} placeholder="First name" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div style={s.row2}>
            <div style={s.fg}><label style={s.label}>Age</label><input style={s.input} type="number" placeholder="22" value={form.age} onChange={e => set('age', e.target.value)} /></div>
            <div style={s.fg}><label style={s.label}>Sex</label>
              <select style={s.input} value={form.sex} onChange={e => set('sex', e.target.value)}>
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
          </div>
          <div style={s.row2}>
            <div style={s.fg}><label style={s.label}>Height</label><input style={s.input} placeholder='5&apos;10"' value={form.height} onChange={e => set('height', e.target.value)} /></div>
            <div style={s.fg}><label style={s.label}>Weight (lbs)</label><input style={s.input} type="number" placeholder="175" value={form.weight} onChange={e => set('weight', e.target.value)} /></div>
          </div>
          <div style={s.fg}><label style={s.label}>Target Weight (lbs)</label><input style={s.input} type="number" placeholder="185" value={form.targetWeight} onChange={e => set('targetWeight', e.target.value)} /></div>
          <button style={s.btnPrimary} onClick={() => setStep(2)}>Next →</button>
        </>}

        {step === 2 && <>
          <div style={s.title}>What's the <span style={s.titleAccent}>goal?</span></div>
          <div style={s.sub}>Pick your primary objective. This shapes everything.</div>
          <div style={s.grid2}>
            {GOALS.map(g => (
              <div key={g.label} style={s.pill(form.goal === g.label)} onClick={() => set('goal', g.label)}>
                <span style={s.pillIcon}>{g.icon}</span>{g.label}
              </div>
            ))}
          </div>
          <div style={s.fg}><label style={s.label}>Training Experience</label>
            <select style={s.input} value={form.experience} onChange={e => set('experience', e.target.value)}>
              <option value="">Select level</option>
              <option>Complete Beginner (0-6 months)</option>
              <option>Intermediate (6mo - 2 years)</option>
              <option>Advanced (2+ years)</option>
            </select>
          </div>
          <div style={s.fg}><label style={s.label}>Days per week you can train</label>
            <select style={s.input} value={form.trainingDays} onChange={e => set('trainingDays', e.target.value)}>
              <option value="">Select</option>
              <option>3 days</option><option>4 days</option><option>5 days</option><option>6 days</option>
            </select>
          </div>
          <button style={s.btnPrimary} onClick={() => setStep(3)}>Next →</button>
          <button style={s.btnSecondary} onClick={() => setStep(1)}>← Back</button>
        </>}

        {step === 3 && <>
          <div style={s.title}>Current <span style={s.titleAccent}>lifts.</span></div>
          <div style={s.sub}>Estimate is fine. We calibrate as you log.</div>
          <div style={s.liftTable}>
            <div style={{ ...s.liftRow, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exercise</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current</div>
              <div style={{ fontSize: 11, color: 'var(--accent)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target</div>
            </div>
            {[['squat', 'Squat'], ['bench', 'Bench'], ['deadlift', 'Deadlift'], ['ohp', 'OHP'], ['pullup', 'Pull-ups']].map(([k, label]) => (
              <div key={k} style={{ ...s.liftRow, marginBottom: 8 }}>
                <div style={s.liftLabel}>{label}</div>
                <input style={s.liftInput} placeholder="lbs" value={form.lifts[k].current} onChange={e => setLift(k, 'current', e.target.value)} />
                <input style={{ ...s.liftInput, borderColor: '#1a2200' }} placeholder="goal" value={form.lifts[k].target} onChange={e => setLift(k, 'target', e.target.value)} />
              </div>
            ))}
          </div>
          <button style={s.btnPrimary} onClick={() => setStep(4)}>Next →</button>
          <button style={s.btnSecondary} onClick={() => setStep(2)}>← Back</button>
        </>}

        {step === 4 && <>
          <div style={s.title}>Show the <span style={s.titleAccent}>vision.</span></div>
          <div style={s.sub}>AI analyzes both photos to understand where you are and where you want to go. Never stored or shared.</div>
          <label style={s.label}>Current Physique</label>
          <div style={s.upload}>
            <input type="file" accept="image/*" onChange={e => handlePhoto(e, 'current')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
            <div style={s.uploadIcon}>📸</div>
            <div style={s.uploadTitle}>{form.currentPhotoPreview ? '✓ Photo uploaded' : 'Upload current photo'}</div>
            <div style={s.uploadSub}>Front-facing, good lighting. Be honest.</div>
            {form.currentPhotoPreview && <img src={form.currentPhotoPreview} style={s.preview} alt="current" />}
          </div>
          <label style={s.label}>Dream Physique</label>
          <div style={s.upload}>
            <input type="file" accept="image/*" onChange={e => handlePhoto(e, 'dream')} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
            <div style={s.uploadIcon}>🎯</div>
            <div style={s.uploadTitle}>{form.dreamPhotoPreview ? '✓ Photo uploaded' : 'Upload goal physique'}</div>
            <div style={s.uploadSub}>A reference photo of the body you're working toward.</div>
            {form.dreamPhotoPreview && <img src={form.dreamPhotoPreview} style={s.preview} alt="dream" />}
          </div>
          <div style={{ background: '#0f0f0f', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            ⚠️ AI analysis is an estimate. Dream physiques may reflect enhanced athletes — your plan is built for natural, sustainable progress.
          </div>
          <button style={s.btnPrimary} onClick={() => setStep(5)}>Next →</button>
          <button style={s.btnSecondary} onClick={() => setStep(3)}>← Back</button>
        </>}

        {step === 5 && <>
          <div style={s.title}>Diet <span style={s.titleAccent}>preferences.</span></div>
          <div style={s.sub}>So your meal plan actually works for your real life.</div>
          <label style={s.label}>Diet Type</label>
          <div style={s.grid2}>
            {DIET_TYPES.map(d => (
              <div key={d.label} style={s.pill(form.dietType === d.label)} onClick={() => set('dietType', d.label)}>
                <span style={s.pillIcon}>{d.icon}</span>{d.label}
              </div>
            ))}
          </div>
          <label style={s.label}>Allergies / Avoid</label>
          <div style={s.allergies}>
            {ALLERGIES.map(a => (
              <div key={a} style={s.tag(form.allergies.includes(a))} onClick={() => toggleAllergy(a)}>{a}</div>
            ))}
          </div>
          <div style={s.fg}><label style={s.label}>Meals per day</label>
            <select style={s.input} value={form.mealsPerDay} onChange={e => set('mealsPerDay', e.target.value)}>
              <option>2 meals</option><option>3 meals</option><option>3 meals + snacks</option>
              <option>4-5 meals</option><option>Intermittent fasting</option>
            </select>
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button style={s.btnPrimary} onClick={handleGenerate}>Generate My Plan →</button>
          <button style={s.btnSecondary} onClick={() => setStep(4)}>← Back</button>
        </>}

      </div>
    </div>
  )
}
