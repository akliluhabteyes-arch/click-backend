import multer from "multer";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";

export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = 500;
  let message = "Internal server error";
  let details;

  if (err instanceof ApiError) {
    ({ status, message, details } = err);
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Image is too large (max 5 MB)" : err.message;
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON body";
  }

  if (status >= 500) console.error(err);

  // Hide internal details in production
  if (status >= 500 && env.isProduction) details = undefined;

  res.status(status).json({ success: false, error: { message, ...(details && { details }) } });
};
