import React from 'react'

export default function TaskItem({ task, onUpdateProgress, onDelete }) {
  return (
    <div className="task">
      <div className="task-header">
        <h4>{task.title}</h4>
        <div className="meta">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</div>
      </div>
      <div className="desc">{task.description}</div>
      <div className="controls">
        <select value={task.progress} onChange={(e) => onUpdateProgress(task, e.target.value)}>
          <option value="not-started">Not started</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <button className="danger" onClick={() => onDelete(task)}>Delete</button>
      </div>
    </div>
  )
}
