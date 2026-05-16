import { useNavigate } from 'react-router-dom'

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--border)' },
  logo: { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-1px' },
  hero: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' },
  blob1: { position: 'absolute', top: '-100px', left: '-100px', width: 400, height: 400, borderRadius: '50%', background: 'var(--accent)', opacity: 0.04, pointerEvents: 'none' },
  blob2: { position: 'absolute', bottom: '-80px', right: '-80px', width: 320, height: 320, borderRadius: '50%', background: 'var(--accent)', opacity: 0.03, pointerEvents: 'none' },
  tag: { display: 'inline-block', background: '#1a2200', color: 'var(--accent)', fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 },
  h1: { fontFamily: 'Syne, sans-serif', fontSize: 'clamp(42px, 8vw, 80px)', fontWeight: 800, lineHeight: 1.05, marginBottom: 20, maxWidth: 800 },
  accent: { color: 'var(--accent)' },
  sub: { fontSize: 18, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 500, marginBottom: 40 },
  btnRow: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  btnPrimary: { padding: '16px 36px', background: 'var(--accent)', color: '#090909', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, fontFamily: 'Syne, sans-serif', cursor: 'pointer', letterSpacing: '-0.3px' },
  btnSecondary: { padding: '16px 36px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 14, fontSize: 16, fontWeight: 500, cursor: 'pointer' },
  features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, padding: '0 32px 60px', maxWidth: 1100, margin: '0 auto', width: '100%' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 20px' },
  cardIcon: { fontSize: 28, marginBottom: 12 },
  cardTitle: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 6 },
  cardSub: { fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }
}

const features = [
  { icon: '🤖', title: 'AI-Generated Plans', sub: 'Your workout and diet built from scratch by AI based on your body, goals, and lifts.' },
  { icon: '📊', title: 'Track Everything', sub: 'Log every lift, every meal. See your progress over time with real data.' },
  { icon: '🏆', title: 'Strength Ranking', sub: 'Know exactly where you stand. Beginner to Elite — ranked on every major lift.' },
  { icon: '👥', title: 'Compete With Friends', sub: 'Add friends, climb the leaderboard. Make gains a competition.' },
  { icon: '🦊', title: 'AI Coach REV', sub: 'Hate your diet? Bored of your split? REV adjusts your plan in real time.' },
  { icon: '📅', title: 'Weekly Schedule', sub: 'Every day laid out — workout days, rest days, meals. Zero thinking required.' }
]

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo}>REVL</div>
        <button style={s.btnSecondary} onClick={() => navigate('/auth')}>Sign In</button>
      </nav>
      <div style={s.hero}>
        <div style={s.blob1} />
        <div style={s.blob2} />
        <div style={s.tag}>AI Personal Trainer</div>
        <h1 style={s.h1}>Forge your <span style={s.accent}>dream</span> physique.</h1>
        <p style={s.sub}>A fully personalized workout and diet plan built by AI. Adapts to you. Tracks everything. Makes you compete.</p>
        <div style={s.btnRow}>
          <button style={s.btnPrimary} onClick={() => navigate('/auth')}>Start for Free →</button>
          <button style={s.btnSecondary} onClick={() => navigate('/auth')}>Sign In</button>
        </div>
      </div>
      <div style={s.features}>
        {features.map(f => (
          <div key={f.title} style={s.card}>
            <div style={s.cardIcon}>{f.icon}</div>
            <div style={s.cardTitle}>{f.title}</div>
            <div style={s.cardSub}>{f.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
