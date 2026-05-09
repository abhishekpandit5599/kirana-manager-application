import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ERROR_MESSAGES } from "../utils/messages";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: false,
      message: null,
      error: err.message,
      data: null,
    });
    return;
  }

  // Handle validation errors if any (e.g. from zod)
  if (err.name === "ZodError") {
    res.status(400).json({
      status: false,
      message: ERROR_MESSAGES.VALIDATION_FAILED,
      error: err.errors[0]?.message || ERROR_MESSAGES.VALIDATION_FAILED,
      data: err.errors
    });
    return;
  }

  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    status: false,
    message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    data: null,
  });
}
