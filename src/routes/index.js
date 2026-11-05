import { Router } from "express";
import { supabase } from "../config/supabase.js";
import publicRoutes from "./public.routes.js";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.get("/health", async (_req, res) => {
  const { error } = await supabase.from("site_settings").select("id").limit(1);
  res.status(error ? 503 : 200).json({
    success: !error,
    data: { status: error ? "degraded" : "ok", database: error ? error.message : "connected", time: new Date().toISOString() },
  });
});

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/", publicRoutes);

export default router;
