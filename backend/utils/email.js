const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    await transporter.sendMail({
      from: `"Grocery App" <${process.env.EMAIL_FROM}>`,
      to, subject, html, text,
    });
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error(`Email send error: ${err.message}`);
    // Don't throw — email failures shouldn't break core flows
  }
};

const emailTemplates = {
  orderConfirmation: (order) => ({
    subject: `Order Confirmed - #${order.orderNumber}`,
    html: `<h2>Your order is confirmed!</h2>
      <p>Order #${order.orderNumber}</p>
      <p>Total: ₹${order.totalAmount}</p>
      <p>Estimated delivery: 30-45 minutes</p>`,
  }),
  orderStatusUpdate: (order, status) => ({
    subject: `Order ${status} - #${order.orderNumber}`,
    html: `<h2>Order Update</h2><p>Your order #${order.orderNumber} is now <strong>${status}</strong>.</p>`,
  }),
  passwordReset: (token) => ({
    subject: 'Password Reset Request',
    html: `<h2>Password Reset</h2>
      <p>Click <a href="${process.env.FRONTEND_URL}/reset-password/${token}">here</a> to reset your password.</p>
      <p>This link expires in 1 hour.</p>`,
  }),
  storeApproved: (store) => ({
    subject: 'Your store has been approved!',
    html: `<h2>Congratulations!</h2><p>Your store <strong>${store.name}</strong> has been approved. You can now start listing products.</p>`,
  }),
};

module.exports = { sendEmail, emailTemplates };
