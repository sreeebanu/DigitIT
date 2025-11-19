import React, { useState } from 'react'
import { login, getMe } from '../api'

export default function Login({ onLogin, switchToSignup }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setErr(null)
    const res = await login({ email, password })
    if (!res || !res.success) {
      setErr(res?.message || 'Login failed')
      return
    }
    localStorage.setItem('token', res.token)
    const me = await getMe(res.token)
    if (me && me.success) onLogin(me.user)
  }

  return (
    <div className="auth">
      <h2>Login</h2>
      {err && <div className="error">{err}</div>}
      <form onSubmit={submit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        <button type="submit">Login</button>
      </form>
      <p>
        No account? <button onClick={switchToSignup} className="link">Sign up</button>
      </p>
    </div>
  )
}
