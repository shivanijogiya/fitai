const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/profile',  require('./routes/profile'));
app.use('/api/workout',  require('./routes/workout'));
app.use('/api/workouts', require('./routes/workout'));
app.use('/api/meal',     require('./routes/meal'));
app.use('/api/meals',    require('./routes/meal'));
app.use('/api/water',    require('./routes/water'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/dashboard',require('./routes/dashboard'));
app.use('/api/chat',     require('./routes/chat'));
app.use('/api/admin',    require('./routes/admin'));

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

// 404
app.use((_, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });
