const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

// Create the send contact email function
exports.sendContactEmail = onRequest({ cors: true }, async (req, res) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: "All fields (name, email, subject, message) are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Configure nodemailer transporter
    // For production, you'll need to configure this with your actual email service
    // This is a basic example that would need proper SMTP configuration
    const transporter = nodemailer.createTransporter({
      // This is a placeholder - you'll need to configure actual email service
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER, // Set in Firebase Functions config
        pass: process.env.EMAIL_PASS  // Set in Firebase Functions config
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'sayeasyteam@gmail.com',
      subject: `SayEasy Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Sent from SayEasy contact form</em></p>
      `,
      replyTo: email
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    logger.info(`Contact form email sent from ${email} with subject: ${subject}`);
    
    return res.status(200).json({ 
      success: true, 
      message: "Email sent successfully" 
    });

  } catch (error) {
    logger.error("Error sending contact email:", error);
    return res.status(500).json({ 
      error: "Failed to send email",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});