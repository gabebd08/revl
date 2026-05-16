import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import { supabase } from '../lib/supabase'
import { strengthRank, rankColor } from '../lib/claude'

const s = {
  page: { padding: 20, maxWidth: 600, margin: '0 auto' },
  title: { fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 24 },
  accent: { color: 'var(--accent)' },
  tabs: { display: 'flex', background: 'var(--surface)', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: (active) => ({ flex: 1, padding: '10px', textAlign: 'center', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#090909' : 'var(--muted)', background: active ? 'var(--accent)' : 'transparent', border: 'none', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }),
  topThree: { display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 8, marginBottom: 20, alignItems: 'end' },
  podiumCard: (rank) => ({ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 10px', textAlign: 'center', borderTop: rank === 1 ? '2px solid var(--accent)' : rank === 2 ? '2px solid #C0C0C0' : '2px solid #CD7F32' }),
  podiumEmoji: { fontSize: 24, marginBottom: 6 },
  podiumName: { fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  podiumScore: (rank) => ({ fontSize: 12, color: rank === 1 ? 'var(--accent)' : rank === 2 ? '#C0C0C0' : '#CD7F32', fontWeight: 600 }),
  leaderRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 8 },
  rankNum: (isMe) => ({ width: 28, height: 28, borderRadius: '50%', background: isMe ? 'var(--accent)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color: isMe ? '#090909' : 'var(--muted)', flexShrink: 0 }),
  avatar: (color) => ({ width: 36, height: 36, borderRadius: '50%', background: color + '22', border: '1.5px solid ' + color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13, color, flexShrink: 0 }),
  nameCol: { flex: 1 },
  uname: (isMe) => ({ fontWeight: isMe ? 700 : 500, fontSize: 14, color: isMe ? 'var(--accent)' : 'var(--text)' }),
  rankBadge: (color) => ({ fontSize: 11, color, fontWeight: 600 }),
  scoreCol: { fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--accent)' },
  addFriend: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 },
  addTitle: { fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 10 },
  addRow: { display: 'flex', gap: 8 },
  addInp: { flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text)', outline: 'none' },
  addBtn: { padding: '12px 18px', background: 'var(--accent)', color: '#090909', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  friendsList: { marginTop: 14 },
  friendRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 },
  friendStatus: (accepted) => ({ fontSize: 11, fontWeight: 600, color: accepted ? 'var(--accent)' : 'var(--muted)' }),
  emptyState: { textAlign: 'center', padding: '32px 20px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }
}

function computeScore(profile) {
  if (!profile?.lifts || !profile?.weight) return 0
  const bw = parseFloat(profile.weight) || 1
  const lifts = { squat: parseFloat(profile.lifts.squat?.current) || 0, bench: parseFloat(profile.lifts.bench?.current) || 0, deadlift: parseFloat(profile.lifts.deadlift?.current) || 0, ohp: parseFloat(profile.lifts.ohp?.current) || 0 }
  const total = Object.values(lifts).reduce((a, b) => a + b, 0)
  return Math.round((total / bw) * 100)
}

const RANK_EMOJIS = { Beginner: '🥉', Novice: '🥈', Intermediate: '🥇', Advanced: '💎', Elite: '👑' }

export default function Leaderboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('global')
  const [globalUsers, setGlobalUsers] = useState([])
  const [friends, setFriends] = useState([])
  const [myProfile, setMyProfile] = useState(null)
  const [friendInput, setFriendInput] = useState('')
  const [addMsg, setAddMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(me)
      const { data: all } = await supabase.from('profiles').select('id, username, lifts, weight, goal').not('weight', 'is', null).limit(50)
      const sorted = (all || []).map(p => ({ ...p, score: computeScore(p) })).sort((a, b) => b.score - a.score)
      setGlobalUsers(sorted)
      const { data: friendships } = await supabase.from('friendships').select('*').or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      const friendIds = (friendships || []).map(f => f.requester_id === user.id ? f.recipient_id : f.requester_id)
      if (friendIds.length > 0) {
        const { data: friendProfiles } = await supabase.from('profiles').select('id, username, lifts, weight, goal').in('id', friendIds)
        const withScores = (friendProfiles || []).map(p => {
          const fs = (friendships || []).find(f => f.requester_id === p.id || f.recipient_id === p.id)
          return { ...p, score: computeScore(p), accepted: fs?.status === 'accepted' }
        }).sort((a, b) => b.score - a.score)
        setFriends(withScores)
      }
    }
    load()
  }, [user])

  async function addFriend() {
    if (!friendInput.trim()) return
    const { data: target } = await supabase.from('profiles').select('id, username').ilike('username', friendInput.trim()).single()
    if (!target) { setAddMsg('User not found.'); return }
    if (target.id === user.id) { setAddMsg("That's you!"); return }
    const { error } = await supabase.from('friendships').insert({ requester_id: user.id, recipient_id: target.id, status: 'accepted' })
    if (error) { setAddMsg('Already added or error.'); return }
    setAddMsg(`Added ${target.username}!`)
    setFriendInput('')
    setTimeout(() => setAddMsg(''), 3000)
  }

  const displayList = tab === 'global' ? globalUsers : [...friends, myProfile].filter(Boolean).sort((a, b) => computeScore(b) - computeScore(a))
  const top3 = displayList.slice(0, 3)
  const rest = displayList.slice(3)
  const myRank = displayList.findIndex(u => u.id === user.id) + 1

  return (
    <div style={s.page}>
      <div style={s.title}><span style={s.accent}>Leaderboard</span></div>
      <div style={s.sub}>Strength score = total lifts ÷ bodyweight × 100</div>

      <div style={s.tabs}>
        <button style={s.tab(tab === 'global')} onClick={() => setTab('global')}>🌍 Global</button>
        <button style={s.tab(tab === 'friends')} onClick={() => setTab('friends')}>👥 Friends</button>
      </div>

      {myRank > 0 && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, textAlign: 'center' }}>You're ranked <span style={{ color: 'var(--accent)', fontWeight: 700 }}>#{myRank}</span> {tab === 'global' ? 'globally' : 'among friends'}</div>}

      {top3.length >= 3 && (
        <div style={s.topThree}>
          {[top3[1], top3[0], top3[2]].map((u, i) => {
            const realRank = i === 0 ? 2 : i === 1 ? 1 : 3
            const emojis = ['🥈', '🥇', '🥉']
            const rank = strengthRank(parseFloat(u?.lifts?.bench?.current) || 0, parseFloat(u?.weight) || 175, 'bench')
            return u ? (
              <div key={u.id} style={s.podiumCard(realRank)}>
                <div style={s.podiumEmoji}>{emojis[i]}</div>
                <div style={s.podiumName}>{u.username || 'Athlete'}</div>
                <div style={s.podiumScore(realRank)}>{u.score} pts</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{rank}</div>
              </div>
            ) : <div key={i} />
          })}
        </div>
      )}

      {rest.map((u, i) => {
        const isMe = u.id === user.id
        const rank = strengthRank(parseFloat(u?.lifts?.bench?.current) || 0, parseFloat(u?.weight) || 175, 'bench')
        const color = rankColor(rank)
        const initials = (u.username || 'A').slice(0, 2).toUpperCase()
        return (
          <div key={u.id} style={s.leaderRow}>
            <div style={s.rankNum(isMe)}>{i + 4}</div>
            <div style={s.avatar(color)}>{initials}</div>
            <div style={s.nameCol}>
              <div style={s.uname(isMe)}>{u.username || 'Athlete'}{isMe ? ' (you)' : ''}</div>
              <div style={s.rankBadge(color)}>{RANK_EMOJIS[rank]} {rank}</div>
            </div>
            <div style={s.scoreCol}>{u.score}</div>
          </div>
        )
      })}

      {displayList.length === 0 && <div style={s.emptyState}>No one here yet. Add friends to compete!</div>}

      <div style={{ ...s.addFriend, marginTop: 24 }}>
        <div style={s.addTitle}>Add a Friend</div>
        <div style={s.addRow}>
          <input style={s.addInp} placeholder="Enter username..." value={friendInput} onChange={e => setFriendInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFriend()} />
          <button style={s.addBtn} onClick={addFriend}>Add</button>
        </div>
        {addMsg && <div style={{ marginTop: 10, fontSize: 13, color: addMsg.includes('!') ? 'var(--accent)' : 'var(--red)', fontWeight: 600 }}>{addMsg}</div>}
      </div>
    </div>
  )
}
