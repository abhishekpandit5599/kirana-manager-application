import jwt from "jsonwebtoken";
import { config } from "../config";

interface JwtPayload {
  userId: string;
  shopId: string;
}

export function signToken(userId: string, shopId: string): string {
  return jwt.sign({ userId, shopId } satisfies JwtPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    if (!decoded.userId || !decoded.shopId) return null;
    return decoded;
  } catch {
    return null;
  }
}
