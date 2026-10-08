const express = require('express');
const mongoose = require('mongoose');
const TuitionRequest = require('../models/TuitionRequest');
const Pool = require('../models/Pool');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { protect, restrictTo } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const router = express.Router();
const MAX_POOL_SIZE = 3;
const POOL_TOTAL_FEE = 1500;
const STUDENT_POOL_FEE = 500;

const getRazorpay = () => process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

const syncPoolPayments = (pool) => {
  const existing = new Map(pool.payments.map((payment) => [payment.student.toString(), payment]));
  pool.students.forEach((student) => {
    if (!existing.has(student.toString())) pool.payments.push({ student, amount: pool.perStudentFees || STUDENT_POOL_FEE });
  });
  pool.payments = pool.payments.filter((payment) => pool.students.some((student) => student.toString() === payment.student.toString()));
  pool.groupReady = pool.students.length === pool.maxSize && pool.payments.length === pool.maxSize && pool.payments.every((payment) => payment.status === 'PAID');
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sameText = (value) => new RegExp(`^${escapeRegExp(value).trim()}$`, 'i');
const haversine = (first, second) => {
  const radius = 6371;
  const latDelta = ((second.lat - first.lat) * Math.PI) / 180;
  const lngDelta = ((second.lng - first.lng) * Math.PI) / 180;
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos((first.lat * Math.PI) / 180) * Math.cos((second.lat * Math.PI) / 180) * Math.sin(lngDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const makePoolCode = (area, studentClass, sequence) => `POOL-${String(area).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}-${String(studentClass).replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase()}-${String(sequence).padStart(3, '0')}`;

router.post('/find-or-create-pool', protect, restrictTo('student'), async (req, res) => {
  try {
    const { subject, studentClass, area, location, budget = POOL_TOTAL_FEE } = req.body;
    if (!subject || !studentClass || !area || location?.lat == null || location?.lng == null) {
      return res.status(400).json({ success: false, message: 'Subject, class, area, latitude, and longitude are required.' });
    }

    const tuitionRequest = await TuitionRequest.create({
      studentId: req.user.id,
      subject,
      studentClass,
      area,
      location,
      budget,
      status: 'SEARCHING_POOL'
    });

    const existingPoolRequest = await TuitionRequest.findOne({
      studentId: req.user.id,
      subject: sameText(subject),
      studentClass: sameText(studentClass),
      area: sameText(area),
      pool: { $exists: true }
    }).populate('pool');
    if (existingPoolRequest?.pool) {
      await TuitionRequest.deleteOne({ _id: tuitionRequest._id });
      return res.json({ success: true, pool: existingPoolRequest.pool, tuitionRequest: existingPoolRequest, isFirstStudent: false, message: `You are already in ${existingPoolRequest.pool.poolCode}.` });
    }

    const candidates = await Pool.find({
      subject: sameText(subject),
      studentClass: sameText(studentClass),
      status: 'OPEN',
      students: { $nin: [req.user.id] },
      $expr: { $lt: [{ $size: '$students' }, MAX_POOL_SIZE] }
    }).sort({ createdAt: 1 });
    const pool = candidates.find((candidate) => haversine(location, candidate.centerLocation) < 2);

    let resultPool = pool;
    let isFirstStudent = false;
    if (resultPool) {
      resultPool.students.push(req.user.id);
      resultPool.perStudentFees = resultPool.totalFees / resultPool.students.length;
      if (resultPool.students.length >= MAX_POOL_SIZE) resultPool.status = 'FULL';
      await resultPool.save();
      tuitionRequest.status = 'JOINED';
      tuitionRequest.pool = resultPool._id;
      await tuitionRequest.save();
    } else {
      const sequence = await Pool.countDocuments({ area: sameText(area), subject: sameText(subject), studentClass: sameText(studentClass) }) + 1;
      resultPool = await Pool.create({
        poolCode: makePoolCode(area, studentClass, sequence),
        subject,
        studentClass,
        area,
        centerLocation: location,
        students: [req.user.id],
        maxSize: MAX_POOL_SIZE,
        totalFees: POOL_TOTAL_FEE,
        totalFee: POOL_TOTAL_FEE,
        perStudentFees: POOL_TOTAL_FEE,
        status: 'OPEN'
      });
      tuitionRequest.pool = resultPool._id;
      await tuitionRequest.save();
      isFirstStudent = true;
    }

    syncPoolPayments(resultPool);
    await resultPool.save();

    return res.status(201).json({
      success: true,
      pool: resultPool,
      tuitionRequest,
      isFirstStudent,
      message: isFirstStudent
        ? `You are the first! Pool ${resultPool.poolCode} was created. As 2 more students join, the fee can become ₹${POOL_TOTAL_FEE / MAX_POOL_SIZE} each.`
        : resultPool.status === 'FULL'
        ? `Good news! This pool is full with 3 students at ₹${POOL_TOTAL_FEE / MAX_POOL_SIZE} each.`
        : `Good news! You joined ${resultPool.poolCode}. Current estimated fee: ₹${Math.round(resultPool.perStudentFees)}.`
    });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'You already created a matching tuition request.' });
    res.status(500).json({ success: false, message: 'Could not find or create pool', error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'teacher'
      ? { status: { $in: ['OPEN', 'FULL', 'ASSIGNED_TO_TEACHER'] } }
      : { students: req.user.id };
    const pools = await Pool.find(filter).populate('students', 'name email').populate('teacher', 'name feePerHour').populate('payments.student', 'name email').sort({ createdAt: -1 });
    for (const pool of pools) {
      syncPoolPayments(pool);
      await pool.save();
    }
    res.json({ success: true, pools });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load pools', error: error.message });
  }
});

router.post('/:id/payment/order', protect, restrictTo('student'), async (req, res) => {
  try {
    const pool = await Pool.findOne({ _id: req.params.id, status: { $in: ['ASSIGNED_TO_TEACHER', 'FULL'] }, students: req.user.id });
    if (!pool) return res.status(404).json({ success: false, message: 'Assigned pool not found.' });
    syncPoolPayments(pool);
    const payment = pool.payments.find((item) => item.student.toString() === req.user.id);
    if (payment.status === 'PAID') return res.json({ success: true, alreadyPaid: true, pool });
    const razorpay = getRazorpay();
    if (!razorpay) return res.status(503).json({ success: false, message: 'Razorpay Test Mode is not configured.' });
    const order = await razorpay.orders.create({ amount: STUDENT_POOL_FEE * 100, currency: 'INR', receipt: `pool_${pool._id}_${req.user.id}` });
    payment.razorpayOrderId = order.id;
    await pool.save();
    res.json({ success: true, keyId: process.env.RAZORPAY_KEY_ID, amount: STUDENT_POOL_FEE, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not create pool payment order', error: error.message });
  }
});

router.post('/:id/payment/verify', protect, restrictTo('student'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const pool = await Pool.findOne({ _id: req.params.id, students: req.user.id });
    if (!pool) return res.status(404).json({ success: false, message: 'Pool not found.' });
    syncPoolPayments(pool);
    const payment = pool.payments.find((item) => item.student.toString() === req.user.id);
    if (!payment || payment.razorpayOrderId !== razorpay_order_id) return res.status(400).json({ success: false, message: 'Payment order does not match this pool.' });
    const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (signature !== razorpay_signature) return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    payment.status = 'PAID';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.paidAt = new Date();
    syncPoolPayments(pool);
    await pool.save();
    res.json({ success: true, pool, groupReady: pool.groupReady, message: pool.groupReady ? 'All students paid. Your group is ready!' : 'Payment received. Waiting for the other students.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not verify pool payment', error: error.message });
  }
});

router.post('/:id/join', protect, restrictTo('student'), async (req, res) => {
  const pool = await Pool.findOne({ _id: req.params.id, status: 'OPEN' });
  if (!pool) return res.status(404).json({ success: false, message: 'Open pool not found.' });
  if (pool.students.some((student) => student.toString() === req.user.id)) return res.json({ success: true, pool, message: 'You are already in this pool.' });
  if (pool.students.length >= pool.maxSize) return res.status(400).json({ success: false, message: 'This pool is full.' });
  pool.students.push(req.user.id);
  pool.perStudentFees = pool.totalFees / pool.students.length;
  if (pool.students.length === pool.maxSize) pool.status = 'FULL';
  await pool.save();
  await TuitionRequest.updateOne({ studentId: req.user.id, pool: pool._id }, { status: 'JOINED' });
  res.json({ success: true, pool, message: 'Joined pool successfully.' });
});

router.post('/:id/one-to-one', protect, restrictTo('student'), async (req, res) => {
  const pool = await Pool.findById(req.params.id);
  if (!pool) return res.status(404).json({ success: false, message: 'Pool not found.' });
  await TuitionRequest.updateOne({ studentId: req.user.id, pool: pool._id }, { status: 'SEARCHING_POOL', $unset: { pool: 1 } });
  pool.students = pool.students.filter((student) => student.toString() !== req.user.id);
  pool.perStudentFees = pool.students.length ? pool.totalFees / pool.students.length : pool.totalFees;
  if (pool.status === 'FULL') pool.status = 'OPEN';
  await pool.save();
  res.json({ success: true, message: 'You can continue with one-to-one tuition.' });
});

router.post('/:id/assign', protect, restrictTo('teacher'), async (req, res) => {
  try {
    const pool = await Pool.findOneAndUpdate(
      { _id: req.params.id, status: 'FULL' },
      { teacher: req.user.id, status: 'ASSIGNED_TO_TEACHER' },
      { new: true }
    ).populate('students', 'name email').populate('teacher', 'name feePerHour');
    if (!pool) return res.status(404).json({ success: false, message: 'Full pool not found.' });

    syncPoolPayments(pool);
    await pool.save();

    await TuitionRequest.updateMany(
      { pool: pool._id, studentId: { $in: pool.students.map((student) => student._id) } },
      { status: 'ASSIGNED_TO_TEACHER', assignedTeacher: req.user.id }
    );

    const teacher = await User.findById(req.user.id).select('name');
    await Promise.all(pool.students.map((student) => sendEmail({
      to: student.email,
      subject: `Your group tutor has accepted ${pool.poolCode}`,
      text: `${teacher.name} accepted your group tuition pool for ${pool.studentClass} ${pool.subject} in ${pool.area}. Your share is ₹${Math.round(pool.perStudentFees)}.`,
      html: `<p><strong>${teacher.name}</strong> accepted your group tuition pool <strong>${pool.poolCode}</strong>.</p><p>Your share is ₹${Math.round(pool.perStudentFees)}.</p>`
    }).catch((error) => console.error('Pool assignment email failed:', error.message))));

    res.json({ success: true, pool, message: 'Group accepted. All students have been notified.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not assign pool', error: error.message });
  }
});

module.exports = { router, haversine };
