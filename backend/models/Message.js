const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    connection: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 }
  },
  { timestamps: true }
);

messageSchema.index({ connection: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);