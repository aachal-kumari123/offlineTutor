const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Connection = require('../models/Connection');
const sendEmail = require('../utils/sendEmail');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

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
      const { teacherId, message, studentPhone } = req.body;

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

// @route   PUT /api/contact/:id/status
// @desc    Teacher updates connection status (accept/reject)
// @access  Private (Teacher)
router.put(
  '/:id/status',
  protect,
  restrictTo('teacher'),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be accepted or rejected'
        });
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

      connection.status = status;
      await connection.save();

      let studentEmailSent = false;
      try {
        await sendEmail({
          to: connection.student.email,
          subject: `Your connection request was ${status} - TutorConnect`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Connection Request Update</h2>
              <p>Hello <strong>${connection.student.name}</strong>,</p>
              <p>Your connection request to <strong>${req.user.name}</strong> has been <strong>${status}</strong>.</p>
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
          ? `Request ${status} successfully. Student has been notified via email.`
          : `Request ${status} successfully, but the student email notification could not be sent.`,
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
