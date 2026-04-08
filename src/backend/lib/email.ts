import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

const smtpOptions = {
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

export const sendEmail = async (data: EmailPayload) => {
  const transporter = nodemailer.createTransport({
    ...smtpOptions,
  });

  return await transporter.sendMail({
    from: `"AI Detector Support" <${process.env.EMAIL_USER || "support@aidetector.com"}>`,
    ...data,
  });
};

export const sendOTP = async (email: string, otp: string) => {
  const subject = "Your Verification Code";
  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; text-align: center;">
      <h2 style="color: #4f46e5;">Welcome to AI Detector</h2>
      <p style="font-size: 16px; color: #374151;">Your verification code is:</p>
      <div style="background-color: #f3f4f6; margin: 20px auto; padding: 20px; border-radius: 8px; width: fit-content;">
        <h1 style="margin: 0; font-size: 32px; letter-spacing: 5px; color: #1f2937;">${otp}</h1>
      </div>
      <p style="font-size: 14px; color: #6b7280;">This code will expire in 10 minutes.</p>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};
