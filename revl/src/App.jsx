import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth.jsx'
import Landing from './pages/Landing.jsx'
import Auth from './pages/Auth.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Schedule from './pages/Schedule.jsx'
import LogWorkout from './pages/LogWorkout.jsx'
import LogMeals from './pages/LogMeals.jsx'
import Progress from './pages/Progress.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Strength from './pages/Strength.jsx'
import Layout from './components/Layout.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--accent)', fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700 }}>REVL</div>
  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)', color: 'var(--accent)', fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700 }}>REVL</div>

  return (
    <>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
        <Route path="/onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
        } />
        <Route path="/schedule" element={
          <ProtectedRoute><Layout><Schedule /></Layout></ProtectedRoute>
        } />
        <Route path="/log-workout" element={
          <ProtectedRoute><Layout><LogWorkout /></Layout></ProtectedRoute>
        } />
        <Route path="/log-meals" element={
          <ProtectedRoute><Layout><LogMeals /></Layout></ProtectedRoute>
        } />
        <Route path="/progress" element={
          <ProtectedRoute><Layout><Progress /></Layout></ProtectedRoute>
        } />
        <Route path="/strength" element={
          <ProtectedRoute><Layout><Strength /></Layout></ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
