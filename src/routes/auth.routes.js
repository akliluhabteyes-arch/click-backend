import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";
import { requireAdmin } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { loginSchema, changePasswordSchema } from "../validators/schemas.js";

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), auth.login);
router.get("/me", requireAdmin, auth.me);
router.post("/change-password", requireAdmin, validate(changePasswordSchema), auth.changePassword);

export default router;
