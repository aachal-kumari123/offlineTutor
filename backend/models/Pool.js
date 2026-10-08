const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, default: 500 },
  status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  paidAt: Date
}, { _id: false });

const poolSchema = new mongoose.Schema(
  {
    poolCode: { type: String, required: true, unique: true, trim: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Connection' }],
    subject: { type: String, required: true, trim: true },
    studentClass: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    centerLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    maxSize: { type: Number, default: 3 },
    totalFees: { type: Number, default: 1500 },
    perStudentFees: { type: Number, default: 500 },
    totalFee: { type: Number, default: 1500 },
    status: { type: String, enum: ['OPEN', 'FULL', 'ASSIGNED_TO_TEACHER', 'forming', 'ready', 'accepted'], default: 'OPEN' },
    lastNotifiedAt: { type: Date }
    ,payments: { type: [paymentSchema], default: [] }
    ,groupReady: { type: Boolean, default: false }
  },
  { timestamps: true }
);

poolSchema.index({ subject: 1, studentClass: 1, status: 1 });

module.exports = mongoose.model('Pool', poolSchema);