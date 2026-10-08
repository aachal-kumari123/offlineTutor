require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/auth');
const teachersRoutes = require('./routes/teachers');
const contactRoutes = require('./routes/contact');
const chatRoutes = require('./routes/chat');
const Connection = require('./models/Connection');
const Pool = require('./models/Pool');
const { router: poolRoutes } = require('./routes/poolRoutes');
const notifyOpenPools = require('./utils/poolExpiry');

const app = express();

// Middleware
const allowedOrigins = new Set([
  'http://localhost:5173',
  'https://offline-tutor.vercel.app',
  ...(process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean)
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'TutorConnect API is running',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/pools', poolRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    return Promise.all([Connection.syncIndexes(), Pool.syncIndexes()]);
  })
  .then(() => {
    setInterval(() => notifyOpenPools().catch((error) => console.error('Pool reminder job failed:', error.message)), 10 * 60 * 1000);
    notifyOpenPools().catch((error) => console.error('Initial pool reminder job failed:', error.message));
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
