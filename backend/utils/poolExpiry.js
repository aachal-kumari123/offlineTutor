const Pool = require('../models/Pool');
const User = require('../models/User');
const sendEmail = require('./sendEmail');

const notifyOpenPools = async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const pools = await Pool.find({ status: 'OPEN', 'students.1': { $exists: true }, createdAt: { $lt: cutoff }, $or: [{ lastNotifiedAt: null }, { lastNotifiedAt: { $lt: cutoff } }] }).populate('students', 'name email');
  for (const pool of pools) {
    await Promise.all(pool.students.map((student) => sendEmail({
      to: student.email,
      subject: `Your ${pool.poolCode} group is ready to decide`,
      text: `Your pool has ${pool.students.length} students. Start with the current group or wait for a third student.`,
      html: `<p>Your <strong>${pool.poolCode}</strong> pool has <strong>${pool.students.length} students</strong>.</p><p>Would you like to start with the current group or wait for a third student?</p>`
    }).catch((error) => console.error('Pool reminder failed:', error.message))));
    pool.lastNotifiedAt = new Date();
    await pool.save();
  }
};

module.exports = notifyOpenPools;
