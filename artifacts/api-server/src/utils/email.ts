import nodemailer from "nodemailer";
import { config } from "../config";
import { logger } from "./logger";

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
    await getTransporter().sendMail({
      from: `"Kirana Manager" <${config.smtpUser}>`,
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
  return sendEmail(to, "Your OTP for Kirana Manager", `
    <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
      <h2 style="color:#1e40af">Kirana Manager</h2>
      <p>Your OTP code is:</p>
      <div style="font-size:32px;font-weight:bold;color:#1e40af;letter-spacing:8px;padding:16px 0">${otp}</div>
      <p style="color:#666;font-size:14px">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
  `);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  return sendEmail(to, "Reset your Kirana Manager password", `
    <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
      <h2 style="color:#1e40af">Kirana Manager</h2>
      <p>You requested a password reset. Click the button below:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#1e40af;color:white;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0">Reset Password</a>
      <p style="color:#666;font-size:14px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `);
}
