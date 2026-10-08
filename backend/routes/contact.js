const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Connection = require('../models/Connection');
const Pool = require('../models/Pool');
const sendEmail = require('../utils/sendEmail');
const { protect, restrictTo } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const router = express.Router();

const createSpecialRequest = (type, subject) => async (req, res) => {
  try {
    const { teacherId, message, studentPhone, slot } = req.body;
    if (!teacherId || !require('mongoose').isValidObjectId(teacherId)) {
      return res.status(400).json({
        success: false,
        message: 'This demo teacher is sample data. Please select a teacher from the connected backend.'
      });
    }
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher', isApproved: true });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const existing = await Connection.findOne({ student: req.user.id, teacher: teacherId, type });
    if (existing) return res.status(400).json({ success: false, message: `You already have a ${type} request with this teacher` });

    const connection = await Connection.create({
      student: req.user.id,
      teacher: teacherId,
      type,
      slot,
      message: message || subject,
      studentPhone: studentPhone || req.user.phone
    });

    let emailSent = false;
    try {
      await sendEmail({
        to: teacher.email,
        subject,
        text: `${req.user.name} requested a ${type} with ${teacher.name}. ${message || ''}`,
        html: `<p><strong>${req.user.name}</strong> requested a ${type} with you on TutorConnect.</p><p>${message || ''}</p>`
      });
      emailSent = true;
    } catch (emailError) {
      console.error(`Teacher ${type} notification failed:`, emailError.message);
    }

    return res.status(201).json({ success: true, emailSent, connection, message: `${type} request sent successfully` });
  } catch (error) {
    console.error(`${type} request error:`, error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${type} request with this teacher`
      });
    }
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

router.post('/demo', protect, restrictTo('student'), createSpecialRequest('demo', 'New 1-Day Free Demo Class Request - TutorConnect'));
router.post('/book', protect, restrictTo('student'), createSpecialRequest('booking', 'New Lesson Booking Request - TutorConnect'));

// @route   POST /api/contact
// @desc    Student connects with teacher → saves request + sends email
// @access  Private (Student)
router.post(
  '/',
  protect,
  restrictTo('student'),
  [
    body('teacherId').notEmpty().withMessage('Teacher ID is required'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 1000 })
      .withMessage('Message too long')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { teacherId, message, studentPhone, requestedSubject, requestedClass, requestedArea } = req.body;

      // Find teacher
      const teacher = await User.findOne({
        _id: teacherId,
        role: 'teacher',
        isApproved: true
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Check if connection already exists
      const existing = await Connection.findOne({
        student: req.user.id,
        teacher: teacherId
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'You have already sent a connection request to this teacher'
        });
      }

      // Save connection request
      const connection = await Connection.create({
        student: req.user.id,
        teacher: teacherId,
        message,
        requestedSubject,
        requestedClass,
        requestedArea,
        studentPhone: studentPhone || req.user.phone
      });
      let teacherEmailSent = false;
      try {
        await sendEmail({
          to: teacher.email,
          subject: `New Student Connection Request - TutorConnect`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">New Connection Request!</h2>
              <p>Hello <strong>${teacher.name}</strong>,</p>
              <p>You have received a new connection request from a student on <strong>TutorConnect</strong>.</p>
              
              <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Student Name:</strong> ${req.user.name}</p>
                <p><strong>Student Email:</strong> ${req.user.email}</p>
                <p><strong>Phone:</strong> ${studentPhone || req.user.phone || 'Not provided'}</p>
                <p><strong>Message:</strong></p>
                <p style="background: white; padding: 12px; border-radius: 4px;">${message}</p>
              </div>

              <p>Please log in to your dashboard to respond to this request.</p>
              <p style="color: #6B7280; font-size: 14px;">— Team TutorConnect</p>
            </div>
          `,
          text: `New connection request from ${req.user.name} (${req.user.email}). Message: ${message}`
        });
        teacherEmailSent = true;
      } catch (emailError) {
        console.error(`Teacher notification failed for ${teacher.email}:`, emailError.message);
      }

      res.status(201).json({
        success: true,
        message: teacherEmailSent
          ? 'Connection request sent successfully. Teacher has been notified via email.'
          : 'Connection request saved, but the teacher email notification could not be sent.',
        emailSent: teacherEmailSent,
        connection
      });
    } catch (error) {
      console.error('Contact error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

// @route   GET /api/contact/my-requests
// @desc    Get connection requests for current user
// @access  Private
router.get('/my-requests', protect, async (req, res) => {
  try {
    let connections;

    if (req.user.role === 'student') {
      connections = await Connection.find({ student: req.user.id })
        .populate('teacher', 'name email subjects feePerHour location profileImage averageRating')
        .sort({ createdAt: -1 });
    } else {
      // Teacher sees requests sent to them
      connections = await Connection.find({ teacher: req.user.id })
        .populate('student', 'name email phone')
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      count: connections.length,
      connections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.get('/pools', protect, async (req, res) => {
  try {
    let filter;
    if (req.user.role === 'teacher') {
      filter = { teacher: req.user.id };
    } else {
      const studentConnections = await Connection.find({ student: req.user.id }).select('_id');
      filter = { connections: { $in: studentConnections.map((item) => item._id) } };
    }
    const pools = await Pool.find(filter)
      .populate('teacher', 'name feePerHour location profileImage')
      .populate({ path: 'connections', populate: { path: 'student', select: 'name' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, pools });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load pools', error: error.message });
  }
});

// @route   POST /api/contact/:id/receipt
// @desc    Generate a record-only payment receipt (no online payment)
// @access  Private (Student or Teacher on accepted connection)
router.post('/:id/receipt', protect, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id).populate('teacher', 'name feePerHour').populate('student', 'name');
    if (!connection || connection.status !== 'accepted') return res.status(403).json({ success: false, message: 'A receipt is available after the request is accepted.' });
    const isParticipant = [connection.teacher._id.toString(), connection.student._id.toString()].includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ success: false, message: 'You cannot access this receipt.' });

    const hours = Math.max(0.5, Number(req.body.hours) || 1);
    const feePerHour = Number(connection.teacher.feePerHour) || 0;
    const receipt = connection.receipt?.receiptNumber
      ? connection.receipt
      : {
          receiptNumber: `TC-${Date.now().toString(36).toUpperCase()}`,
          amount: feePerHour * hours,
          feePerHour,
          hours,
          generatedAt: new Date(),
          generatedBy: req.user.id
        };
    connection.receipt = receipt;
    await connection.save();
    res.json({ success: true, receipt, connectionId: connection._id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not generate receipt', error: error.message });
  }
});

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// @route   POST /api/contact/:id/platform-fee/order
// @desc    Create a Razorpay test-mode order for an additional acceptance
// @access  Private (Teacher)
router.post('/:id/platform-fee/order', protect, restrictTo('teacher'), async (req, res) => {
  try {
    const connection = await Connection.findOne({ _id: req.params.id, teacher: req.user.id, status: 'pending' });
    if (!connection) return res.status(404).json({ success: false, message: 'Pending connection request not found' });

    const acceptedCount = await Connection.countDocuments({ teacher: req.user.id, status: 'accepted' });
    if (acceptedCount === 0) {
      return res.json({ success: true, paymentRequired: false, connection });
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay Test Mode is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env.'
      });
    }

    const platformFee = Number(process.env.PLATFORM_FEE || 99);
    const order = await razorpay.orders.create({
      amount: platformFee * 100,
      currency: 'INR',
      receipt: `tutor_${connection._id}`,
      notes: { connectionId: connection._id.toString(), teacherId: req.user.id.toString() }
    });

    connection.razorpayOrderId = order.id;
    await connection.save();
    return res.json({
      success: true,
      paymentRequired: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      platformFee,
      order,
      connection
    });
  } catch (error) {
    console.error('Razorpay order error:', error);
    return res.status(500).json({ success: false, message: 'Could not create Razorpay order', error: error.message });
  }
});

// @route   POST /api/contact/:id/platform-fee/verify
// @desc    Verify a Razorpay payment and mark the request fee as paid
// @access  Private (Teacher)
router.post('/:id/platform-fee/verify', protect, restrictTo('teacher'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const connection = await Connection.findOne({ _id: req.params.id, teacher: req.user.id, status: 'pending' });
    if (!connection) return res.status(404).json({ success: false, message: 'Pending connection request not found' });
    if (!connection.razorpayOrderId || connection.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Razorpay order does not match this request' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Razorpay payment verification failed' });
    }

    connection.platformFeePaid = true;
    connection.platformFeeAmount = Number(process.env.PLATFORM_FEE || 99);
    connection.platformFeePaidAt = new Date();
    connection.razorpayPaymentId = razorpay_payment_id;
    await connection.save();
    return res.json({ success: true, message: 'Razorpay test payment verified.', platformFeePaid: true, connection });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    return res.status(500).json({ success: false, message: 'Razorpay payment verification failed', error: error.message });
  }
});

// @route   POST /api/contact/:id/platform-fee
// @desc    Demo payment for accepting an additional student request
// @access  Private (Teacher)
router.post('/:id/platform-fee', protect, restrictTo('teacher'), async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Use the Razorpay order and verify endpoints for platform fee payments.'
  });

  try {
    const connection = await Connection.findOne({
      _id: req.params.id,
      teacher: req.user.id,
      status: 'pending'
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Pending connection request not found'
      });
    }

    const acceptedCount = await Connection.countDocuments({
      teacher: req.user.id,
      status: 'accepted'
    });
    const platformFee = Number(process.env.PLATFORM_FEE || 99);

    if (acceptedCount === 0) {
      return res.json({
        success: true,
        demo: true,
        message: 'No platform fee is required for the first accepted request.',
        platformFeePaid: false,
        connection
      });
    }

    connection.platformFeePaid = true;
    connection.platformFeeAmount = platformFee;
    connection.platformFeePaidAt = new Date();
    await connection.save();

    res.json({
      success: true,
      demo: true,
      message: `Demo payment of ₹${platformFee} completed. You can now accept this request.`,
      platformFeePaid: true,
      platformFee,
      connection
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Demo payment failed', error: error.message });
  }
});

// @route   PUT /api/contact/:id/status
// @desc    Teacher updates connection status (accept/reject)
// @access  Private (Teacher)
router.put(
  '/:id/status',
  protect,
  restrictTo('teacher'),
  async (req, res) => {
    try {
      const { status, rejectionReason, suggestedSlot, progressStatus } = req.body;

      if (status && !['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be accepted or rejected'
        });
      }

      if (progressStatus && !['request_sent', 'accepted', 'demo_done', 'classes_started'].includes(progressStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid progress status' });
      }

      const connection = await Connection.findOne({
        _id: req.params.id,
        teacher: req.user.id
      }).populate('student', 'name email');

      if (!connection) {
        return res.status(404).json({
          success: false,
          message: 'Connection request not found'
        });
      }

      if (status === 'accepted' && connection.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Request is already ${connection.status}`
        });
      }

      if (status === 'rejected' && !rejectionReason?.trim()) {
        return res.status(400).json({ success: false, message: 'Please provide a reason for rejecting this request' });
      }

      if (progressStatus && connection.status !== 'accepted') {
        return res.status(400).json({ success: false, message: 'Accept the request before updating its progress' });
      }

      if (status === 'accepted' && !connection.platformFeePaid) {
        const acceptedCount = await Connection.countDocuments({
          teacher: req.user.id,
          status: 'accepted'
        });

        if (acceptedCount > 0) {
          return res.status(402).json({
            success: false,
            paymentRequired: true,
            platformFee: Number(process.env.PLATFORM_FEE || 99),
            message: 'Complete the platform fee demo payment before accepting another request.'
          });
        }
      }

      if (status) connection.status = status;
      if (status === 'accepted') connection.progressStatus = 'accepted';
      if (status === 'rejected') {
        connection.rejectionReason = rejectionReason.trim();
        connection.suggestedSlot = suggestedSlot || undefined;
      }
      if (progressStatus) connection.progressStatus = progressStatus;
      await connection.save();

      let studentEmailSent = false;
      try {
        await sendEmail({
          to: connection.student.email,
          subject: 'Your TutorConnect request was updated',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Connection Request Update</h2>
              <p>Hello <strong>${connection.student.name}</strong>,</p>
              <p>Your connection request to <strong>${req.user.name}</strong> has been updated to <strong>${status || progressStatus}</strong>.</p>
              ${status === 'rejected' ? `<p><strong>Reason:</strong> ${rejectionReason}</p>${suggestedSlot?.day ? `<p><strong>Suggested time:</strong> ${suggestedSlot.day} ${suggestedSlot.start} - ${suggestedSlot.end}</p>` : ''}` : ''}
              <p style="color: #6B7280; font-size: 14px;">— Team TutorConnect</p>
            </div>
          `
        });
        studentEmailSent = true;
      } catch (emailErr) {
        console.error(`Student notification failed for ${connection.student.email}:`, emailErr.message);
      }

      res.json({
        success: true,
        message: studentEmailSent
          ? 'Request updated successfully. Student has been notified via email.'
          : 'Request updated successfully, but the student email notification could not be sent.',
        emailSent: studentEmailSent,
        connection
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

module.exports = router;
