import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'
import { strengthRank, rankColor } from '../lib/claude'

const s = {
  page: { padding: 20, maxWidth: 600, margin: '0 auto' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 24 },
  accent: { color: 'var(--accent)' },
  overallCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 24, marginBottom: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' },
  overallBg: { position: 'absolute', inset: 0, opacity: 0.04, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120 },
  overallRank: (color) => ({ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, color, marginBottom: 4 }),
  overallLabel: { fontSize: 13, color: 'var(--muted)' },
  liftGrid: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 },
  liftCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 },
  liftHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  liftName: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 },
  rankBadge: (color) => ({ display: 'inline-block', background: color + '22', color, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100 }),
  liftStats: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 },
  liftStat: { textAlign: 'center' },
  liftStatVal: { fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700 },
  liftStatLabel: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  progressBar: { height: 6, background: 'var(--border)', borderRadius: 100, overflow: 'hidden', marginBottom: 6 },
  progressFill: (pct, color) => ({ height: '100%', background: color, borderRadius: 100, width: Math.min(pct, 100) + '%', transition: 'width 0.6s ease' }),
  progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)' },
  ranksRef: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, marginBottom: 20 },
  rankRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 },
  section: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 12 }
}

const RANK_ORDER = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite']
const RANK_RATIOS = {
  squat: { Beginner: 0.75, Novice: 1.0, Intermediate: 1.5, Advanced: 2.0, Elite: 2.5 },
  bench: { Beginner: 0.5, Novice: 0.75, Intermediate: 1.25, Advanced: 1.75, Elite: 2.0 },
  deadlift: { Beginner: 1.0, Novice: 1.5, Intermediate: 2.0, Advanced: 2.5, Elite: 3.0 },
  ohp: { Beginner: 0.35, Novice: 0.55, Intermediate: 0.8, Advanced: 1.1, Elite: 1.3 }
}

function rankProgress(liftWeight, bodyweight, liftType) {
  const ratio = liftWeight / bodyweight
  const ranks = RANK_RATIOS[liftType]
  const currentRankIdx = RANK_ORDER.indexOf(strengthRank(liftWeight, bodyweight, liftType))
  const nextRank = RANK_ORDER[currentRankIdx + 1]
  if (!nextRank) return { pct: 100, nextTarget: null }
  const currentMin = ranks[RANK_ORDER[currentRankIdx]] * bodyweight
  const nextMin = ranks[nextRank] * bodyweight
  const pct = ((liftWeight - currentMin) / (nextMin - currentMin)) * 100
  return { pct: Math.max(0, pct), nextTarget: Math.round(nextMin) }
}

export default function Strength() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.from('profiles').select('lifts, weight, sex').eq('id', user.id).single().then(({ data }) => setProfile(data))
  }, [user])

  if (!profile) return <div style={{ padding: 20, color: 'var(--muted)' }}>Loading...</div>

  const bw = parseFloat(profile.weight) || 175
  const lifts = profile.lifts || {}

  const liftData = [
    { key: 'squat', name: 'Squat', weight: parseFloat(lifts.squat?.current) || 0 },
    { key: 'bench', name: 'Bench Press', weight: parseFloat(lifts.bench?.current) || 0 },
    { key: 'deadlift', name: 'Deadlift', weight: parseFloat(lifts.deadlift?.current) || 0 },
    { key: 'ohp', name: 'Overhead Press', weight: parseFloat(lifts.ohp?.current) || 0 }
  ].filter(l => l.weight > 0)

  const ranks = liftData.map(l => RANK_ORDER.indexOf(strengthRank(l.weight, bw, l.key)))
  const avgRankIdx = ranks.length > 0 ? Math.floor(ranks.reduce((a, b) => a + b, 0) / ranks.length) : 0
  const overallRank = RANK_ORDER[avgRankIdx] || 'Beginner'
  const overallColor = rankColor(overallRank)

  const rankEmoji = { Beginner: '🥉', Novice: '🥈', Intermediate: '🥇', Advanced: '💎', Elite: '👑' }

  return (
    <div style={s.page}>
      <div style={s.title}>Strength <span style={s.accent}>Rank</span></div>
      <div style={s.sub}>Based on your bodyweight ratios. Log workouts to auto-update.</div>

      <div style={s.overallCard}>
        <div style={s.overallBg}>{rankEmoji[overallRank]}</div>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{rankEmoji[overallRank]}</div>
        <div style={s.overallRank(overallColor)}>{overallRank.toUpperCase()}</div>
        <div style={s.overallLabel}>Overall Strength Level · {bw} lbs bodyweight</div>
      </div>

      {liftData.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
          Log workouts to see your strength rankings update automatically.
        </div>
      ) : (
        <div style={s.liftGrid}>
          {liftData.map(lift => {
            const rank = strengthRank(lift.weight, bw, lift.key)
            const color = rankColor(rank)
            const { pct, nextTarget } = rankProgress(lift.weight, bw, lift.key)
            const ratio = (lift.weight / bw).toFixed(2)
            return (
              <div key={lift.key} style={s.liftCard}>
                <div style={s.liftHeader}>
                  <div style={s.liftName}>{lift.name}</div>
                  <div style={s.rankBadge(color)}>{rank}</div>
                </div>
                <div style={s.liftStats}>
                  <div style={s.liftStat}><div style={{ ...s.liftStatVal, color }}>{lift.weight}</div><div style={s.liftStatLabel}>lbs</div></div>
                  <div style={s.liftStat}><div style={s.liftStatVal}>{ratio}×</div><div style={s.liftStatLabel}>BW Ratio</div></div>
                  <div style={s.liftStat}><div style={{ ...s.liftStatVal, color: 'var(--accent)' }}>{nextTarget || '—'}</div><div style={s.liftStatLabel}>Next Rank</div></div>
                </div>
                <div style={s.progressBar}><div style={s.progressFill(pct, color)} /></div>
                <div style={s.progressLabel}>
                  <span>{rank}</span>
                  {nextTarget && <span>{Math.round(pct)}% to {RANK_ORDER[RANK_ORDER.indexOf(rank) + 1]}</span>}
                  {!nextTarget && <span>🏆 Max Rank</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={s.section}>Rank Reference (Bodyweight Multiples)</div>
      <div style={s.ranksRef}>
        {[
          { rank: 'Beginner', color: rankColor('Beginner'), emoji: '🥉', desc: 'Just starting out' },
          { rank: 'Novice', color: rankColor('Novice'), emoji: '🥈', desc: '3-6 months consistent' },
          { rank: 'Intermediate', color: rankColor('Intermediate'), emoji: '🥇', desc: '1-2 years of training' },
          { rank: 'Advanced', color: rankColor('Advanced'), emoji: '💎', desc: '3+ years, serious lifting' },
          { rank: 'Elite', color: rankColor('Elite'), emoji: '👑', desc: 'Top percentile athletes' }
        ].map(r => (
          <div key={r.rank} style={{ ...s.rankRow, borderBottom: r.rank === 'Elite' ? 'none' : '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{r.emoji}</span>
              <div>
                <div style={{ fontWeight: 600, color: r.color }}>{r.rank}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
