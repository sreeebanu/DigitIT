const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// basic rate limiter for auth endpoints
const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
app.use('/auth', limiter);

app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);

// catch 404
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

// centralized error handler
app.use(errorHandler);

module.exports = app;
