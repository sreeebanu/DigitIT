import React, { useEffect, useState } from 'react'
import { getTasks, createTask, updateTask, deleteTask, getMe } from '../api'
import TaskItem from '../components/TaskItem'

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [filterProgress, setFilterProgress] = useState('all')
  const [dueFilter, setDueFilter] = useState('all')
  const token = localStorage.getItem('token')

  const loadTasks = async () => {
    const params = {}
    if (dueFilter && dueFilter !== 'all') params.due = dueFilter
    const res = await getTasks(token, params)
    if (res && res.success) setTasks(res.tasks)
  }

  useEffect(() => {
    loadTasks()
  }, [dueFilter])

  const visibleTasks = tasks.filter((t) => (filterProgress === 'all' ? true : t.progress === filterProgress))

  const submit = async (e) => {
    e.preventDefault()
    const payload = { title, description }
    if (dueDate) payload.dueDate = dueDate
    const res = await createTask(token, payload)
    if (res && res.success) {
      setTitle('')
      setDescription('')
      setDueDate('')
      loadTasks()
    } else {
      alert(res?.message || 'Create failed')
    }
  }

  const onUpdateProgress = async (task, progress) => {
    const res = await updateTask(token, task._id, { progress })
    if (res && res.success) loadTasks()
    else alert(res?.message || 'Update failed')
  }

  const onDelete = async (task) => {
    if (!confirm('Delete task?')) return
    const res = await deleteTask(token, task._id)
    if (res && res.success) loadTasks()
    else alert(res?.message || 'Delete failed')
  }

  return (
    <div className="container">
      <header className="header">
        <h2>Dashboard</h2>
        <div>
          <span className="muted">{user.email} ({user.role})</span>
          {user.role === 'student' && user.teacher && (
            <div className="muted">Teacher: {user.teacher.email} ({user.teacher.id})</div>
          )}
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      <section className="controls">
        <form onSubmit={submit} className="create-form">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <button type="submit">Add Task</button>
        </form>

        <div className="filters">
          <label>
            Progress:
            <select value={filterProgress} onChange={(e) => setFilterProgress(e.target.value)}>
              <option value="all">All</option>
              <option value="not-started">Not started</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label>
            Due:
            <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="week">Due this week</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>

          <button onClick={loadTasks}>Refresh</button>
        </div>
      </section>

      <section className="tasks">
        {visibleTasks.length === 0 && <div>No tasks</div>}
        {visibleTasks.map((t) => (
          <TaskItem key={t._id} task={t} onUpdateProgress={onUpdateProgress} onDelete={onDelete} />
        ))}
      </section>
    </div>
  )
}
