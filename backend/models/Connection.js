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
    requestedSubject: { type: String, trim: true },
    requestedClass: { type: String, trim: true },
    requestedArea: { type: String, trim: true },
    type: {
      type: String,
      enum: ['connection', 'demo', 'booking'],
      default: 'connection'
    },
    slot: {
      day: String,
      start: String,
      end: String
    },
    studentPhone: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    platformFeePaid: {
      type: Boolean,
      default: false
    },
    progressStatus: {
      type: String,
      enum: ['request_sent', 'accepted', 'demo_done', 'classes_started'],
      default: 'request_sent'
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
      trim: true
    },
    suggestedSlot: {
      day: { type: String, trim: true },
      start: { type: String, trim: true },
      end: { type: String, trim: true }
    },
    platformFeeAmount: {
      type: Number,
      default: 0
    },
    platformFeePaidAt: {
      type: Date
    },
    razorpayOrderId: {
      type: String,
      trim: true
    },
    razorpayPaymentId: {
      type: String,
      trim: true
    },
    receipt: {
      receiptNumber: String,
      amount: Number,
      feePerHour: Number,
      hours: Number,
      generatedAt: Date,
      generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  },
  { timestamps: true }
);

// Keep payment identifiers available for support and reconciliation.
connectionSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

// Prevent duplicate connection requests
connectionSchema.index({ student: 1, teacher: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);
