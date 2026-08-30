const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const requiredSettings = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
  const missingSettings = requiredSettings.filter((setting) => !process.env[setting]);

  if (missingSettings.length > 0) {
    throw new Error(`Email configuration missing: ${missingSettings.join(', ')}`);
  }

  const port = Number(process.env.EMAIL_PORT);
  const emailUser = process.env.EMAIL_USER.trim();
  const emailPass = process.env.EMAIL_HOST === 'smtp.gmail.com'
    ? process.env.EMAIL_PASS.replace(/\s/g, '')
    : process.env.EMAIL_PASS;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  // Email options
  const mailOptions = {
    from: process.env.EMAIL_FROM?.trim() || emailUser,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${options.to}:`, info.messageId);
  return info;
};

module.exports = sendEmail;
