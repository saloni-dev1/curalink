require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const sessionRoutes = require('./routes/session');
const queryRoutes = require('./routes/query');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// Routes
app.use('/api/session', sessionRoutes);
app.use('/api/query', queryRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// MongoDB connect
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/curalink';
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Start server anyway for testing without DB
    app.listen(PORT, () => console.log(`Server running on port ${PORT} (no DB)`));
  });
