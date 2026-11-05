import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const ADMIN_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../Admin");

const app = express();

if (env.trustProxy) app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(morgan(env.isProduction ? "combined" : "dev"));

// ---- Admin panel (single-file PWA in /Admin), served at /admin ----
app.use(
  "/admin",
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        connectSrc: ["'self'"],
        manifestSrc: ["'self'", "data:"],
        workerSrc: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null, // allow plain-http localhost
      },
    },
  }),
  express.static(ADMIN_DIR, {
    setHeaders: (res) => res.setHeader("Cache-Control", "no-cache"),
  })
);

// ---- API ----
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // allow server-to-server / curl requests (no Origin header)
      if (!origin || env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) {
        return cb(null, true);
      }
      // development: allow any localhost port (Vite, Live Server, ...)
      if (!env.isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }
      cb(null, false);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.get("/", (_req, res) =>
  res.json({ success: true, data: { name: "ClickAddis API", health: "/api/health", admin: "/admin" } })
);
app.use("/api", apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
