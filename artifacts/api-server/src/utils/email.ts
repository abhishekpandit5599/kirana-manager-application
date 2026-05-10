import nodemailer from "nodemailer";
import { config } from "../config";
import { logger } from "./logger";
import { Resend } from "resend";

const resend = new Resend(config.smtpPass);

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!config.smtpUser || !config.smtpPass) {
    logger.warn("SMTP not configured — skipping email send");
    return false;
  }
  try {
    // await getTransporter().sendMail({
    //   from: `"KiranaPro" <${config.smtpFromUser}>`,
    //   to,
    //   subject,
    //   html,
    // });

    const response = await resend.emails.send({
      from: `KiranaPro <${config.smtpFromUser}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err: any) {
    logger.error({ err }, "Failed to send email");
    return false;
  }
}

export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  return sendEmail(to, "Your OTP for KiranaPro", `
    <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
      <h2 style="color:#10b981">KiranaPro</h2>
      <p>Your OTP code is:</p>
      <div style="font-size:32px;font-weight:bold;color:#10b981;letter-spacing:8px;padding:16px 0">${otp}</div>
      <p style="color:#666;font-size:14px">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
  `);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  return sendEmail(to, "Reset your KiranaPro password", `
    <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
      <h2 style="color:#10b981">KiranaPro</h2>
      <p>You requested a password reset. Click the button below:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#10b981;color:white;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0">Reset Password</a>
      <p style="color:#666;font-size:14px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `);
}
