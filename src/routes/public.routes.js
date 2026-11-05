import { Router } from "express";
import { resources } from "../config/resources.js";
import { resourceController } from "../controllers/resource.controller.js";
import * as site from "../controllers/site.controller.js";
import * as chat from "../controllers/chat.controller.js";
import * as contact from "../controllers/contact.controller.js";
import { validate } from "../middleware/validate.js";
import { chatLimiter, contactLimiter } from "../middleware/rateLimit.js";
import { chatSchema, contactSchema } from "../validators/schemas.js";

const router = Router();

// Whole website content in one call
router.get("/site", site.getSite);
router.get("/settings", site.getPublicSettings);

// GET /api/stats, /api/values, /api/services, /api/solutions, /api/customers,
//     /api/testimonials, /api/team, /api/social-links, /api/chat-quick-actions
for (const resource of resources.filter((r) => !r.adminOnly)) {
  router.get(`/${resource.path}`, resourceController(resource).listPublic);
}

// Chat widget
router.get("/chat/config", chat.getConfig);
router.post("/chat", chatLimiter, validate(chatSchema), chat.sendMessage);

// Contact form
router.post("/contact", contactLimiter, validate(contactSchema), contact.submit);

export default router;
