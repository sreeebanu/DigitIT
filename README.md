# EdTech Learning Task Manager — Take-Home

This repository contains a backend (`/server`) for the EdTech Learning Task Manager take-home assignment. The frontend (`/client`) is a placeholder with instructions on how to scaffold a React client.

## What I implemented
- Authentication (signup/login) with bcrypt password hashing and JWT.
- Role support: `student` and `teacher`. Students must supply a `teacherId` on signup.
- Task CRUD API with role-based access rules:
  - Students can view and edit only their own tasks.
  - Teachers can view:
    - tasks they created
    - tasks created by students assigned to them (users whose `teacherId` equals the teacher's id)
  - Only the task owner (creator) can edit or delete the task.
- Centralized error handling — all errors return `{ success: false, message: "..." }`.
- Input validation with `joi`.

## Server quick start
1. Copy `server/.env.example` to `server/.env` and set values (MONGO_URI, JWT_SECRET).
2. From `server/` run:

```powershell
# install dependencies
npm install

# start server
npm run dev
```

Server runs on `PORT` (default 4000).

## API summary
- POST /auth/signup
  - body: { email, password, role, teacherId? }
  - If role is `student`, `teacherId` is required and must reference an existing teacher.
- POST /auth/login
  - body: { email, password }
  - returns { success: true, token }
- GET /tasks (authenticated)
- POST /tasks (authenticated)
  - body: { title, description?, dueDate?, progress? }
- PUT /tasks/:id (authenticated) — only owner
- DELETE /tasks/:id (authenticated) — only owner

## Frontend
A minimal React client is expected under `/client`. To scaffold quickly:

```powershell
cd client
npx create-react-app .
# or use Vite:
# npm create vite@latest . -- --template react
```

Then implement pages: Signup, Login, Dashboard (list tasks, create task, update progress, delete). Store JWT in `localStorage` and send `Authorization: Bearer <token>` header with requests.

## AI usage disclosure
AI helped generate initial project scaffolding and boilerplate code (routes, models, middleware). I reviewed and adapted the code and wrote the authorization and validation logic myself.

## Next steps / Optional bonus
- Implement date filtering endpoints (due this week / overdue) — server-side filtering.
- Add pagination for teachers (if >10 tasks).
- Build a responsive React UI with Bootstrap or Tailwind.
- Add tests (Jest) and a sample seed script for demo data.


## Notes
- For simplicity, tasks are stored with `userId` as the creator. Students create their own tasks; teachers create their own tasks too. Teachers will see student-created tasks if the student is assigned to them.
- If you want teacher-created tasks assigned to a particular student, we can add an explicit `assigneeId` field to `Task`.
