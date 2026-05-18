require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const candidateRoutes = require('./routes/candidates');
const matchRoutes = require('./routes/match');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware — allow all localhost origins in dev, restrict in prod
app.use(cors({
  origin: (origin, callback) => {
    // No origin = curl/Postman/server-to-server — always allow
    if (!origin) return callback(null, true);
    // Always allow any localhost port (dev)
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // In production allow the configured FRONTEND_URL
    const allowed = (process.env.FRONTEND_URL || '').split(',').map(o => o.trim()).filter(Boolean);
    if (allowed.some(o => origin === o || origin.startsWith(o))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`), false);
  },
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors()); // handle preflight for all routes
app.use(express.json());

// Routes
app.use('/api/candidates', candidateRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Candidate Shortlisting System API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
