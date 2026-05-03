import { randomInt } from "crypto";

export function generateOtp(): string {
  return randomInt(100000, 999999).toString();
}

export function isOtpExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function getOtpExpiry(minutesFromNow: number = 10): Date {
  return new Date(Date.now() + minutesFromNow * 60 * 1000);
}
