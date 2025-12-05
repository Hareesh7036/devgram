const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.mailtrap.io
  port: process.env.SMTP_PORT, // 2525
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Mailtrap username
    pass: process.env.SMTP_PASS, // Mailtrap password
  },
});

const createSendEmailCommand = (toAddress, fromAddress, subject, body) => {
  return {
    from: fromAddress,
    to: toAddress,
    cc: [], // Equivalent to CcAddresses
    replyTo: [], // Equivalent to ReplyToAddresses
    subject: subject,
    html: `<h1>${body}</h1>`, // Direct HTML string
    text: "This is the text format email", // Direct text string
  };
};

const run = async (subject, body, toEmailId) => {
  const mailOptions = createSendEmailCommand(
    toEmailId, // toAddress
    process.env.EMAIL_FROM, // fromAddress
    subject,
    body
  );

  try {
    const result = await transporter.sendMail(mailOptions);
    return result; // Returns messageId, etc.
  } catch (caught) {
    if (caught.code === "EAUTH") {
      // Nodemailer auth error (like MessageRejected)
      return caught;
    }
    throw caught;
  }
};

module.exports = { run };
