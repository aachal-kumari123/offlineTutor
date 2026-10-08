const mongoose = require('mongoose');

const tuitionRequestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true, trim: true },
    studentClass: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    location: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lng: { type: Number, required: true, min: -180, max: 180 }
    },
    budget: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['SEARCHING_POOL', 'POOL_FOUND', 'JOINED', 'ASSIGNED_TO_TEACHER'],
      default: 'SEARCHING_POOL'
    },
    pool: { type: mongoose.Schema.Types.ObjectId, ref: 'Pool' },
    assignedTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

tuitionRequestSchema.index({ studentId: 1, subject: 1, studentClass: 1, area: 1 });

module.exports = mongoose.model('TuitionRequest', tuitionRequestSchema);
