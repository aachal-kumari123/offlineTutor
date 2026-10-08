const express = require('express');
const Connection = require('../models/Connection');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();

const acceptedConnection = (connection, userId) => (
  connection && connection.status === 'accepted' &&
  (connection.student.toString() === userId || connection.teacher.toString() === userId)
);

router.get('/:connectionId', protect, async (req, res) => {
  const connection = await Connection.findById(req.params.connectionId);
  if (!acceptedConnection(connection, req.user.id)) return res.status(403).json({ success: false, message: 'Chat opens after the teacher accepts.' });
  const messages = await Message.find({ connection: connection._id }).populate('sender', 'name role').sort({ createdAt: 1 });
  res.json({ success: true, messages });
});

router.post('/:connectionId', protect, async (req, res) => {
  const connection = await Connection.findById(req.params.connectionId);
  if (!acceptedConnection(connection, req.user.id)) return res.status(403).json({ success: false, message: 'Chat opens after the teacher accepts.' });
  if (!req.body.text?.trim()) return res.status(400).json({ success: false, message: 'Message is required' });
  const message = await Message.create({ connection: connection._id, sender: req.user.id, text: req.body.text.trim() });
  await message.populate('sender', 'name role');
  res.status(201).json({ success: true, message });
});

module.exports = router;