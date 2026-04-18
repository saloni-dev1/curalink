const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// Create new session
router.post('/', async (req, res) => {
  try {
    const { patientName, disease, location } = req.body;
    if (!disease) return res.status(400).json({ error: 'Disease is required' });

    const session = new Session({ patientName, disease, location, messages: [] });
    await session.save();
    res.json({ sessionId: session._id, session });
  } catch (err) {
    // If no MongoDB, return a fake session ID
    const fakeId = 'session_' + Date.now();
    res.json({ sessionId: fakeId, session: { _id: fakeId, ...req.body, messages: [] } });
  }
});

// Get session
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ updatedAt: -1 }).limit(20).select('-messages');
    res.json(sessions);
  } catch (err) {
    res.json([]);
  }
});

module.exports = router;
