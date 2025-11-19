# Client — EdTech Task Manager

Minimal React (Vite) client for the EdTech Learning Task Manager.

Quick start:

```powershell
cd client
npm install
npm run dev
```

By default the client expects the API at `http://localhost:4000`. To change, set `VITE_API_BASE` in your environment when starting Vite.

Pages:
- Signup
- Login
- Dashboard: list tasks (role-based), create task, update progress, delete task, filter by progress, filter by due date (this week / overdue)

Notes:
- JWT is stored in `localStorage` as `token` and passed as `Authorization: Bearer <token>`.
- Student signup requires `teacherId` (ID of teacher user created already). You can create a teacher via signup first and copy its ID into student signup.
