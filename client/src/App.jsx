import React, { useEffect, useState } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import { getMe } from './api'

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('login')

  useEffect(() => {
    async function fetchMe() {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await getMe(token)
      if (res && res.success) setUser(res.user)
    }
    fetchMe()
  }, [])

  const onLogin = (user) => {
    setUser(user)
    setPage('dashboard')
  }

  const onLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setPage('login')
  }

  if (!user) {
    return (
      <div className="container">
        {page === 'login' ? (
          <>
            <Login onLogin={(u) => { onLogin(u) }} switchToSignup={() => setPage('signup')} />
          </>
        ) : (
          <Signup switchToLogin={() => setPage('login')} />
        )}
      </div>
    )
  }

  return <Dashboard user={user} onLogout={onLogout} />
}
