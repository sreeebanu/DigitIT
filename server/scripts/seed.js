require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const Task = require('../src/models/Task');

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  // Clear collections (prompt warning in README before running in production)
  await Task.deleteMany({});
  await User.deleteMany({});

  const password = 'password123';
  const teacherHash = await bcrypt.hash(password, 10);
  const studentHash = await bcrypt.hash(password, 10);

  const teacher = new User({ email: 'demo.teacher@example.com', passwordHash: teacherHash, role: 'teacher' });
  await teacher.save();

  const studentA = new User({ email: 'demo.student.a@example.com', passwordHash: studentHash, role: 'student', teacherId: teacher._id });
  await studentA.save();

  const studentB = new User({ email: 'demo.student.b@example.com', passwordHash: studentHash, role: 'student', teacherId: teacher._id });
  await studentB.save();

  // Create tasks for students
  const t1 = new Task({ userId: studentA._id, title: 'Read Chapter 1', description: 'Intro to topic', dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000), progress: 'not-started' });
  const t2 = new Task({ userId: studentA._id, title: 'Complete Exercise 1', description: '', dueDate: new Date(Date.now() - 24 * 3600 * 1000), progress: 'in-progress' });
  const t3 = new Task({ userId: studentB._id, title: 'Watch Lecture', description: 'Lecture 2', progress: 'not-started' });
  const t4 = new Task({ userId: teacher._id, title: 'Prepare Assignment', description: 'Create assignment for students', progress: 'not-started' });

  await t1.save();
  await t2.save();
  await t3.save();
  await t4.save();

  console.log('Seed complete:');
  console.log('Teacher:', { id: teacher._id.toString(), email: teacher.email, password });
  console.log('Student A:', { id: studentA._id.toString(), email: studentA.email, password });
  console.log('Student B:', { id: studentB._id.toString(), email: studentB.email, password });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});
