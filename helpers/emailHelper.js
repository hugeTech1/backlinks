// helpers/emailHelper.js

const nodemailer = require("nodemailer");
require("dotenv/config");
const sendEmail = async (to, subject, text) => {
  try {
    // Set up the transporter with email service credentials
    const transporter = nodemailer.createTransport({
      service: "gmail", // e.g., "gmail"
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
    });

    // Set up email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
