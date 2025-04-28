const nodemailer = require('nodemailer');

class MailSender {
  constructor() {
    this._transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(targetEmail, subject, content) {
    const message = {
      from: 'noreply@openmusicapp.com',
      to: targetEmail,
      subject,
      text: content,
    };

    try {
      const result = await this._transporter.sendMail(message);
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}

module.exports = MailSender;