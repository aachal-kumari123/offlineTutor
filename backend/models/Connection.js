const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    studentPhone: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// Prevent duplicate connection requests
connectionSchema.index({ student: 1, teacher: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);
