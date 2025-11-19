import React, { useState } from 'react'
import { signup } from '../api'

export default function Signup({ switchToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [teacherId, setTeacherId] = useState('')
  const [msg, setMsg] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    const payload = { email, password, role }
    if (role === 'student') payload.teacherId = teacherId
    const res = await signup(payload)
    if (!res || !res.success) return setMsg(res?.message || 'Signup failed')
    setMsg('Account created. You can login now.')
  }

  return (
    <div className="auth">
      <h2>Signup</h2>
      {msg && <div className="message">{msg}</div>}
      <form onSubmit={submit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        <div className="row">
          <label>
            <input type="radio" checked={role === 'student'} onChange={() => setRole('student')} /> Student
          </label>
          <label>
            <input type="radio" checked={role === 'teacher'} onChange={() => setRole('teacher')} /> Teacher
          </label>
        </div>
        {role === 'student' && (
          <input value={teacherId} onChange={(e) => setTeacherId(e.target.value)} placeholder="Teacher ID (required)" />
        )}
        <button type="submit">Create account</button>
      </form>
      <p>
        Have an account? <button onClick={switchToLogin} className="link">Login</button>
      </p>
    </div>
  )
}
