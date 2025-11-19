const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Ensure that if role === 'student' then teacherId is required.
userSchema.pre('validate', function (next) {
  if (this.role === 'student' && !this.teacherId) {
    this.invalidate('teacherId', 'Students must have a teacherId');
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
