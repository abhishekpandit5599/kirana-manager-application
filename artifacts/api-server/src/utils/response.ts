import { Response } from "express";

export interface StandardResponse<T = any> {
  status: boolean;
  message: string | null;
  error: string | null;
  data: T | null;
}

export function sendSuccess<T = any>(
  res: Response,
  data: T,
  message: string | null = "Operation successful",
  statusCode: number = 200
) {
  const response: StandardResponse<T> = {
    status: true,
    message,
    error: null,
    data,
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  error: string,
  statusCode: number = 500,
  message: string | null = null
) {
  const response: StandardResponse<null> = {
    status: false,
    message,
    error,
    data: null,
  };
  return res.status(statusCode).json(response);
}
