const express = require('express');
const Joi = require('joi');
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require auth
router.use(auth);

// Validation schemas
const createTaskSchema = Joi.object({ title: Joi.string().required(), description: Joi.string().allow('', null), dueDate: Joi.date().optional().allow(null), progress: Joi.string().valid('not-started', 'in-progress', 'completed').optional() });
const updateTaskSchema = Joi.object({ title: Joi.string().optional(), description: Joi.string().allow('', null).optional(), progress: Joi.string().valid('not-started', 'in-progress', 'completed').optional() });

// GET /tasks
// Students: own tasks only
// Teachers: tasks created by teacher OR tasks belonging to their assigned students
router.get('/', async (req, res, next) => {
  try {
    const user = req.user;
    // support date filtering via query param `due`
    // due=week => tasks with dueDate within next 7 days
    // due=overdue => tasks with dueDate < today and progress != 'completed'
    const dueFilter = req.query.due;
    if (user.role === 'student') {
      const baseQuery = { userId: user.id };
      // apply date filters
      if (dueFilter === 'week') {
        const now = new Date();
        const week = new Date();
        week.setDate(now.getDate() + 7);
        baseQuery.dueDate = { $gte: now, $lte: week };
      } else if (dueFilter === 'overdue') {
        const today = new Date();
        baseQuery.dueDate = { $lt: today };
        baseQuery.progress = { $ne: 'completed' };
      }
      const tasks = await Task.find(baseQuery).sort({ createdAt: -1 });
      return res.json({ success: true, tasks });
    }

    if (user.role === 'teacher') {
      // find assigned students' ids
      const students = await User.find({ teacherId: user.id }).select('_id');
      const studentIds = students.map((s) => s._id.toString());
      // base query: tasks either created by teacher OR created by their students
      const baseQuery = { userId: { $in: [user.id, ...studentIds] } };
      // apply date filters
      if (dueFilter === 'week') {
        const now = new Date();
        const week = new Date();
        week.setDate(now.getDate() + 7);
        baseQuery.dueDate = { $gte: now, $lte: week };
      } else if (dueFilter === 'overdue') {
        const today = new Date();
        baseQuery.dueDate = { $lt: today };
        baseQuery.progress = { $ne: 'completed' };
      }

      const tasks = await Task.find(baseQuery).sort({ createdAt: -1 });
      return res.json({ success: true, tasks });
    }

    return res.status(403).json({ success: false, message: 'Invalid role' });
  } catch (err) {
    next(err);
  }
});

// POST /tasks - create a task. userId must match logged-in user's id
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = createTaskSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    // enforce userId from auth token
    const creatorId = req.user.id;
    const task = new Task({ userId: creatorId, title: value.title, description: value.description || '', dueDate: value.dueDate || undefined, progress: value.progress || 'not-started' });
    await task.save();
    return res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id - only task owner can update
router.put('/:id', async (req, res, next) => {
  try {
    const { error, value } = updateTaskSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.userId.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Only task owner can update' });

    if (value.title !== undefined) task.title = value.title;
    if (value.description !== undefined) task.description = value.description;
    if (value.progress !== undefined) task.progress = value.progress;

    await task.save();
    return res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id - only owner can delete
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.userId.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Only task owner can delete' });
    await task.deleteOne();
    return res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
