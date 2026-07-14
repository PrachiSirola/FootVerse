import nodemailer from "nodemailer";

/**
 * Gmail transport. Requires in .env:
 *   MAIL_USER=youraddress@gmail.com
 *   MAIL_PASS=your-16-char-app-password   (NOT your normal password)
 *   MAIL_FROM="FootVerse <youraddress@gmail.com>"   (optional)
 *
 * Create the App Password at: https://myaccount.google.com/apppasswords
 * (2-Step Verification must be ON for the Google account.)
 */
let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  return transporter;
}

const FROM = () => process.env.MAIL_FROM || `FootVerse <${process.env.MAIL_USER}>`;

function baseTemplate(title, bodyHtml) {
  return `
  <div style="background:#F7F4EF;padding:32px 0;font-family:Georgia,'Times New Roman',sans">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px -20px rgba(51,35,26,0.35)">
      <div style="background:#33231A;padding:24px 32px">
        <span style="font-size:24px;font-weight:700;color:#fff">Foot<span style="color:#D9B87A">Verse</span></span>
        <div style="font-size:11px;letter-spacing:1px;color:rgba(255,255,255,0.6);margin-top:2px">YOUR UNIVERSE OF FOOTWEAR</div>
      </div>
      <div style="padding:32px">
        <h1 style="margin:0 0 12px;font-size:22px;color:#33231A">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:18px 32px;border-top:1px solid #eee;font-size:12px;color:#6E655C;font-family:Arial,sans">
        If you didn't request this, you can safely ignore this email.
      </div>
    </div>
  </div>`;
}

export async function sendOtpEmail(to, otp, name = "") {
  const body = `
    <p style="font-family:Arial,sans;color:#6E655C;font-size:15px;line-height:1.6">
      Hi ${name || "there"}, use the code below to verify your email. It expires in 5 minutes.
    </p>
    <div style="margin:24px 0;text-align:center">
      <span style="display:inline-block;background:#F1ECE2;color:#33231A;font-size:34px;
        letter-spacing:10px;font-weight:700;padding:16px 28px;border-radius:12px;font-family:Arial,sans">
        ${otp}
      </span>
    </div>`;
  await getTransporter().sendMail({
    from: FROM(),
    to,
    subject: `${otp} is your FootVerse verification code`,
    html: baseTemplate("Verify your email", body),
  });
}

export async function sendResetEmail(to, resetUrl, name = "") {
  const body = `
    <p style="font-family:Arial,sans;color:#6E655C;font-size:15px;line-height:1.6">
      Hi ${name || "there"}, we received a request to reset your password. This link expires in 30 minutes.
    </p>
    <div style="margin:24px 0;text-align:center">
      <a href="${resetUrl}" style="display:inline-block;background:#33231A;color:#fff;
        text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;
        font-family:Arial,sans;font-weight:600">Reset Password</a>
    </div>
    <p style="font-family:Arial,sans;color:#6E655C;font-size:12px;word-break:break-all">
      Or paste this link: ${resetUrl}
    </p>`;
  await getTransporter().sendMail({
    from: FROM(),
    to,
    subject: "Reset your FootVerse password",
    html: baseTemplate("Reset your password", body),
  });
}