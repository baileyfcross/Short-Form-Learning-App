import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message, details: err.details });
    return;
  }

  const statusCode = typeof err?.status === "number" ? err.status : 500;
  if (statusCode === 500) {
    console.error(err);
  }
  const message = statusCode === 500 ? "Internal server error" : err.message;
  res.status(statusCode).json({ message });
};
