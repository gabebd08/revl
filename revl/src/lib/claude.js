const CLAUDE_API = '/api/claude'

export async function callClaude(messages, system = '') {
  const res = await fetch(CLAUDE_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system,
      messages
    })
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

export async function generatePlan(profile) {
  const system = `You are REVL's AI coach. Generate a complete, personalized fitness plan as valid JSON only. No markdown, no explanation, just raw JSON.

Return this exact structure:
{
  "phase": "bulk|cut|recomp|maintain",
  "summary": "2-3 sentence overview of the plan",
  "dailyCalories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "weeklySchedule": {
    "monday": { "type": "workout|rest", "focus": "string", "exercises": [{ "name": "string", "sets": number, "reps": "string", "rest": "string" }] },
    "tuesday": { "type": "workout|rest", "focus": "string", "exercises": [] },
    "wednesday": { "type": "workout|rest", "focus": "string", "exercises": [] },
    "thursday": { "type": "workout|rest", "focus": "string", "exercises": [] },
    "friday": { "type": "workout|rest", "focus": "string", "exercises": [] },
    "saturday": { "type": "workout|rest", "focus": "string", "exercises": [] },
    "sunday": { "type": "rest", "focus": "Recovery", "exercises": [] }
  },
  "meals": [
    { "name": "string", "time": "string", "calories": number, "protein": number, "carbs": number, "fats": number, "foods": ["string"] }
  ],
  "weakPoints": ["string"],
  "strengths": ["string"],
  "recommendations": ["string"]
}`

  const userMessage = `Generate a plan for:
Name: ${profile.name}
Age: ${profile.age}, Sex: ${profile.sex}
Height: ${profile.height}, Weight: ${profile.weight}lbs, Target: ${profile.targetWeight}lbs
Goal: ${profile.goal}
Experience: ${profile.experience}
Training days/week: ${profile.trainingDays}
Current lifts - Squat: ${profile.lifts.squat.current}lbs (target: ${profile.lifts.squat.target}lbs), Bench: ${profile.lifts.bench.current}lbs (target: ${profile.lifts.bench.target}lbs), Deadlift: ${profile.lifts.deadlift.current}lbs (target: ${profile.lifts.deadlift.target}lbs), OHP: ${profile.lifts.ohp.current}lbs (target: ${profile.lifts.ohp.target}lbs)
Diet type: ${profile.dietType}
Allergies: ${profile.allergies.join(', ') || 'none'}
Meals per day: ${profile.mealsPerDay}`

  const raw = await callClaude([{ role: 'user', content: userMessage }], system)
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return null
  }
}

export async function chatWithCoach(messages, plan, profile) {
  const system = `You are REV, REVL's friendly AI fitness coach. You're represented as a small fox mascot. Be conversational, encouraging but direct. Keep responses under 150 words.

The user's current plan:
- Phase: ${plan?.phase || 'Not set'}
- Daily calories: ${plan?.dailyCalories || 'Not set'}
- Protein target: ${plan?.protein || 'Not set'}g
- Goal: ${profile?.goal || 'Not set'}

You can suggest adjustments to their diet or workouts. If they want a change, describe it clearly. Be like a knowledgeable gym friend, not a corporate bot.`

  const raw = await callClaude(messages, system)
  return raw
}

export function strengthRank(liftWeight, bodyweight, liftType) {
  const ratios = {
    squat: [
      { rank: 'Beginner', min: 0, ratio: 0.75 },
      { rank: 'Novice', min: 0.75, ratio: 1.0 },
      { rank: 'Intermediate', min: 1.0, ratio: 1.5 },
      { rank: 'Advanced', min: 1.5, ratio: 2.0 },
      { rank: 'Elite', min: 2.0, ratio: 99 }
    ],
    bench: [
      { rank: 'Beginner', min: 0, ratio: 0.5 },
      { rank: 'Novice', min: 0.5, ratio: 0.75 },
      { rank: 'Intermediate', min: 0.75, ratio: 1.25 },
      { rank: 'Advanced', min: 1.25, ratio: 1.75 },
      { rank: 'Elite', min: 1.75, ratio: 99 }
    ],
    deadlift: [
      { rank: 'Beginner', min: 0, ratio: 1.0 },
      { rank: 'Novice', min: 1.0, ratio: 1.5 },
      { rank: 'Intermediate', min: 1.5, ratio: 2.0 },
      { rank: 'Advanced', min: 2.0, ratio: 2.5 },
      { rank: 'Elite', min: 2.5, ratio: 99 }
    ],
    ohp: [
      { rank: 'Beginner', min: 0, ratio: 0.35 },
      { rank: 'Novice', min: 0.35, ratio: 0.55 },
      { rank: 'Intermediate', min: 0.55, ratio: 0.8 },
      { rank: 'Advanced', min: 0.8, ratio: 1.1 },
      { rank: 'Elite', min: 1.1, ratio: 99 }
    ]
  }

  const ratio = liftWeight / bodyweight
  const standards = ratios[liftType] || ratios.bench
  for (let i = standards.length - 1; i >= 0; i--) {
    if (ratio >= standards[i].min) return standards[i].rank
  }
  return 'Beginner'
}

export function rankColor(rank) {
  const colors = {
    Beginner: '#CD7F32',
    Novice: '#C0C0C0',
    Intermediate: '#FFD700',
    Advanced: '#42b8f5',
    Elite: '#c8f542'
  }
  return colors[rank] || '#666'
}
