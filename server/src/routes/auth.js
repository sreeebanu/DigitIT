const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = require('../middleware/auth');
const router = express.Router();

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'teacher').required(),
  teacherId: Joi.string().optional().allow(null, '')
});

router.post('/signup', async (req, res, next) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const { email, password, role, teacherId } = value;

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    if (role === 'student') {
      if (!teacherId) return res.status(400).json({ success: false, message: 'Students must include teacherId' });
      // ensure teacher exists and is teacher
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'teacher') return res.status(400).json({ success: false, message: 'Invalid teacherId' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ email, passwordHash, role, teacherId: teacherId || null });
    await user.save();

    return res.status(201).json({ success: true, message: 'User created' });
  } catch (err) {
    next(err);
  }
});

const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });

router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const { email, password } = value;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const payload = { id: user._id.toString(), role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'change-this-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me - returns current authenticated user info
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    // req.user is attached by auth middleware
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // if student, include teacher email/id for display
    let teacher = null;
    if (user.role === 'student' && user.teacherId) {
      teacher = await User.findById(user.teacherId).select('_id email');
    }

    res.json({ success: true, user: { id: user._id.toString(), email: user.email, role: user.role, teacher: teacher ? { id: teacher._id.toString(), email: teacher.email } : null } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

