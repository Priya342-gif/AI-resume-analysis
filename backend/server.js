require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');
const matchRoutes = require('./routes/match');
const aiRoutes = require('./routes/ai');
const { protect } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl || frontendUrl === '*') return callback(null, true);
    const allowed = frontendUrl.split(',').map(o => o.trim()).filter(Boolean);
    if (allowed.some(o => origin === o || origin.startsWith(o))) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`), false);
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());

app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes — require JWT token
app.use('/api/candidates', protect, candidateRoutes);
app.use('/api/match', protect, matchRoutes);
app.use('/api/ai', protect, aiRoutes);

// Health check (public)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Candidate Shortlisting System API is running',
    timestamp: new Date().toISOString()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect DB and start
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
