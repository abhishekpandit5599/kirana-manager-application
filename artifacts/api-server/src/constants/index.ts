export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_INVALID: "OTP_INVALID",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
} as const;

export const NOTIFICATION_TYPES = {
  LOW_STOCK: "low_stock",
  INVOICE: "invoice",
  SALARY: "salary",
  SYSTEM: "system",
} as const;

export const PAYMENT_METHODS = ["cash", "upi"] as const;
export const INVOICE_STATUS = ["paid", "unpaid"] as const;
export const ATTENDANCE_STATUS = ["present", "absent", "half"] as const;
export const UNITS = ["kg", "pcs", "litre", "gm", "ml", "dozen", "pack"] as const;
