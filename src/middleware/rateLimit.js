import rateLimit from "express-rate-limit";

const limiter = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, error: { message } },
  });

export const apiLimiter = limiter(15, 600, "Too many requests, please try again later");
export const contactLimiter = limiter(15, 5, "Too many messages sent. Please try again in a few minutes");
export const chatLimiter = limiter(1, 30, "You are sending messages too quickly");
export const authLimiter = limiter(15, 10, "Too many login attempts. Please try again later");
