const mongoose = require('mongoose')
const request = require('supertest')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../src/app')
const User = require('../src/models/User')
const Task = require('../src/models/Task')

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

afterEach(async () => {
  await User.deleteMany({})
  await Task.deleteMany({})
})

describe('Auth and Tasks integration', () => {
  test('teacher can see assigned student tasks; only owner can modify/delete', async () => {
    // create teacher
    const teacherSignup = await request(app).post('/auth/signup').send({ email: 'teacher@example.com', password: 'password', role: 'teacher' })
    expect(teacherSignup.status).toBe(201)

    const teacher = await User.findOne({ email: 'teacher@example.com' })
    expect(teacher).toBeTruthy()

    // teacher login
    const teacherLogin = await request(app).post('/auth/login').send({ email: 'teacher@example.com', password: 'password' })
    expect(teacherLogin.status).toBe(200)
    const teacherToken = teacherLogin.body.token
    expect(teacherToken).toBeTruthy()

    // create student with teacherId
    const studentSignup = await request(app).post('/auth/signup').send({ email: 'student@example.com', password: 'password', role: 'student', teacherId: teacher._id.toString() })
    expect(studentSignup.status).toBe(201)

    const student = await User.findOne({ email: 'student@example.com' })
    expect(student).toBeTruthy()

    // student login
    const studentLogin = await request(app).post('/auth/login').send({ email: 'student@example.com', password: 'password' })
    expect(studentLogin.status).toBe(200)
    const studentToken = studentLogin.body.token
    expect(studentToken).toBeTruthy()

    // student creates a task
    const createRes = await request(app).post('/tasks').set('Authorization', `Bearer ${studentToken}`).send({ title: 'Read Chapter 1', description: 'Intro', progress: 'not-started' })
    expect(createRes.status).toBe(201)
    const task = createRes.body.task
    expect(task).toBeTruthy()
    expect(task.userId).toBe(student._id.toString())

    // teacher GET /tasks should include the student's task
    const teacherTasks = await request(app).get('/tasks').set('Authorization', `Bearer ${teacherToken}`)
    expect(teacherTasks.status).toBe(200)
    expect(Array.isArray(teacherTasks.body.tasks)).toBe(true)
    const found = teacherTasks.body.tasks.find((t) => t._id === task._id)
    expect(found).toBeTruthy()

    // teacher tries to update student's task -> should be forbidden (403)
    const teacherUpdate = await request(app).put(`/tasks/${task._id}`).set('Authorization', `Bearer ${teacherToken}`).send({ progress: 'in-progress' })
    expect(teacherUpdate.status).toBe(403)

    // student updates own task -> success
    const studentUpdate = await request(app).put(`/tasks/${task._id}`).set('Authorization', `Bearer ${studentToken}`).send({ progress: 'in-progress' })
    expect(studentUpdate.status).toBe(200)
    expect(studentUpdate.body.task.progress).toBe('in-progress')

    // teacher attempts to delete student's task -> forbidden
    const teacherDelete = await request(app).delete(`/tasks/${task._id}`).set('Authorization', `Bearer ${teacherToken}`)
    expect(teacherDelete.status).toBe(403)

    // student deletes own task -> success
    const studentDelete = await request(app).delete(`/tasks/${task._id}`).set('Authorization', `Bearer ${studentToken}`)
    expect(studentDelete.status).toBe(200)
  })

  test('validation, duplicate signup, auth/me and date filters work as expected', async () => {
    // Attempt to signup a student without teacherId -> should fail
    const badStudent = await request(app).post('/auth/signup').send({ email: 'bads@example.com', password: 'pw12345', role: 'student' })
    expect(badStudent.status).toBe(400)

    // Create a teacher and a student properly
    await request(app).post('/auth/signup').send({ email: 't2@example.com', password: 'password', role: 'teacher' })
    const teacher = await User.findOne({ email: 't2@example.com' })

    const ssignup = await request(app).post('/auth/signup').send({ email: 's2@example.com', password: 'password', role: 'student', teacherId: teacher._id.toString() })
    expect(ssignup.status).toBe(201)

    // Duplicate signup
    const dup = await request(app).post('/auth/signup').send({ email: 's2@example.com', password: 'password', role: 'student', teacherId: teacher._id.toString() })
    expect(dup.status).toBe(409)

    // Login with wrong credentials
    const badLogin = await request(app).post('/auth/login').send({ email: 's2@example.com', password: 'wrong' })
    expect(badLogin.status).toBe(401)

    // Login properly
    const tLogin = await request(app).post('/auth/login').send({ email: 't2@example.com', password: 'password' })
    const teacherToken = tLogin.body.token
    const sLogin = await request(app).post('/auth/login').send({ email: 's2@example.com', password: 'password' })
    const studentToken = sLogin.body.token

    // auth/me for student should include teacher info
    const me = await request(app).get('/auth/me').set('Authorization', `Bearer ${studentToken}`)
    expect(me.status).toBe(200)
    expect(me.body.user).toBeTruthy()
    expect(me.body.user.role).toBe('student')
    expect(me.body.user.teacher).toBeTruthy()

    // Create tasks with due dates for student
    const now = new Date()
    const in3 = new Date(now);
    in3.setDate(now.getDate() + 3);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const later = new Date(now);
    later.setDate(now.getDate() + 20);

    // student creates: in3, yesterday, later
    const t1 = await request(app).post('/tasks').set('Authorization', `Bearer ${studentToken}`).send({ title: 'Soon', dueDate: in3.toISOString() })
    expect(t1.status).toBe(201)
    const t2 = await request(app).post('/tasks').set('Authorization', `Bearer ${studentToken}`).send({ title: 'Old', dueDate: yesterday.toISOString() })
    expect(t2.status).toBe(201)
    const t3 = await request(app).post('/tasks').set('Authorization', `Bearer ${studentToken}`).send({ title: 'Later', dueDate: later.toISOString() })
    expect(t3.status).toBe(201)

    // Student: due=week should return only the one in next 7 days
    const studentWeek = await request(app).get('/tasks?due=week').set('Authorization', `Bearer ${studentToken}`)
    expect(studentWeek.status).toBe(200)
    expect(studentWeek.body.tasks.some((x) => x.title === 'Soon')).toBe(true)
    expect(studentWeek.body.tasks.some((x) => x.title === 'Later')).toBe(false)

    // Student: overdue should return the 'Old' task
    const studentOver = await request(app).get('/tasks?due=overdue').set('Authorization', `Bearer ${studentToken}`)
    expect(studentOver.status).toBe(200)
    expect(studentOver.body.tasks.some((x) => x.title === 'Old')).toBe(true)

    // Teacher: due=week should include student's 'Soon'
    const teacherWeek = await request(app).get('/tasks?due=week').set('Authorization', `Bearer ${teacherToken}`)
    expect(teacherWeek.status).toBe(200)
    expect(teacherWeek.body.tasks.some((x) => x.title === 'Soon')).toBe(true)

    // Teacher creates own task and can update/delete it
    const teacherCreate = await request(app).post('/tasks').set('Authorization', `Bearer ${teacherToken}`).send({ title: 'Teach Task' })
    expect(teacherCreate.status).toBe(201)
    const teachTask = teacherCreate.body.task

    const update = await request(app).put(`/tasks/${teachTask._id}`).set('Authorization', `Bearer ${teacherToken}`).send({ progress: 'in-progress' })
    expect(update.status).toBe(200)
    expect(update.body.task.progress).toBe('in-progress')

    const del = await request(app).delete(`/tasks/${teachTask._id}`).set('Authorization', `Bearer ${teacherToken}`)
    expect(del.status).toBe(200)
  })
})
