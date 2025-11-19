const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, options)
  try {
    return await res.json()
  } catch (err) {
    return { success: false, message: 'Invalid JSON from server' }
  }
}

export async function signup(payload) {
  return request('/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
}

export async function login(payload) {
  return request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
}

export async function getMe(token) {
  return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
}

export async function getTasks(token, params = {}) {
  const qs = new URLSearchParams(params).toString()
  return request('/tasks' + (qs ? `?${qs}` : ''), { headers: { Authorization: `Bearer ${token}` } })
}

export async function createTask(token, payload) {
  return request('/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
}

export async function updateTask(token, id, payload) {
  return request(`/tasks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
}

export async function deleteTask(token, id) {
  return request(`/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
}
