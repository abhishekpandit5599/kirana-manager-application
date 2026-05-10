// Typed environment configuration with defaults
export const config = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",

  // JWT
  jwtSecret: process.env.JWT_SECRET ?? "kirana_jwt_secret_2024_change_me",
  jwtExpiresIn: "7d",

  // Bcrypt
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),

  // SMTP
  smtpHost: process.env.SMTP_HOST ?? "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFromUser: process.env.SMTP_FROM_USER ?? "",

  // Twilio WhatsApp
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM ?? "",

  // App
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",

  // Facebook Cloud API for WhatsApp
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
} as const;
