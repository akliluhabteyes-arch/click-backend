import { Router } from "express";
import { resources } from "../config/resources.js";
import { resourceController } from "../controllers/resource.controller.js";
import * as site from "../controllers/site.controller.js";
import * as contact from "../controllers/contact.controller.js";
import * as uploads from "../controllers/upload.controller.js";
import * as users from "../controllers/users.controller.js";
import { requireAdmin, requireSuperadmin } from "../middleware/auth.js";
import { imageUpload } from "../middleware/upload.js";

const router = Router();

// Every admin route requires a valid Supabase access token
router.use(requireAdmin);

// ---- Admin accounts (superadmin only) ----
router.get("/users", requireSuperadmin, users.list);
router.post("/users", requireSuperadmin, users.create);
router.patch("/users/:id", requireSuperadmin, users.update);
router.delete("/users/:id", requireSuperadmin, users.remove);

// ---- Site settings ----
router.get("/settings", site.getSettings);
router.patch("/settings", site.updateSettings);
router.post("/settings/images/:key", imageUpload, site.uploadSettingsImage);
router.delete("/settings/images/:key", site.deleteSettingsImage);

// ---- Contact messages ----
router.get("/contact-messages", contact.list);
router.get("/contact-messages/stats", contact.stats);
router.get("/contact-messages/:id", contact.getOne);
router.patch("/contact-messages/:id", contact.update);
router.delete("/contact-messages/:id", contact.remove);

// ---- Generic image upload ----
router.post("/uploads", imageUpload, uploads.upload);
router.delete("/uploads", uploads.remove);

// ---- Content CRUD for every resource ----
// GET/POST /api/admin/<path>   GET/PATCH/DELETE /api/admin/<path>/:id
for (const resource of resources) {
  const c = resourceController(resource);
  const withImage = resource.image ? [imageUpload] : [];

  router.get(`/${resource.path}`, c.listAll);
  router.post(`/${resource.path}`, ...withImage, c.create);
  router.get(`/${resource.path}/:id`, c.getOne);
  router.patch(`/${resource.path}/:id`, ...withImage, c.update);
  router.delete(`/${resource.path}/:id`, c.remove);
}

export default router;
