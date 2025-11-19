const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
    // attach minimal user info
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = { id: user._id.toString(), role: user.role, teacherId: user.teacherId };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
