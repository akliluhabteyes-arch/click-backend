import "dotenv/config";

const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "JWT_SECRET",
];

const fail = (message) => {
  console.error(`\n[config] ${message}`);
  console.error("[config] Copy .env.example to .env and fill in the values.\n");
  process.exit(1);
};

const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
if (missing.length) fail(`Missing required environment variables: ${missing.join(", ")}`);
if (process.env.JWT_SECRET.trim().length < 32) fail("JWT_SECRET must be at least 32 characters");

const list = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  corsOrigins: list(process.env.CORS_ORIGINS || "http://localhost:8080"),
  trustProxy: process.env.TRUST_PROXY === "true",

  supabase: {
    url: process.env.SUPABASE_URL.trim(),
    serviceKey: process.env.SUPABASE_SERVICE_KEY.trim(),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    apiKey: process.env.CLOUDINARY_API_KEY.trim(),
    apiSecret: process.env.CLOUDINARY_API_SECRET.trim(),
    folder: (process.env.CLOUDINARY_FOLDER || "clickaddis").trim(),
  },

  jwt: {
    secret: process.env.JWT_SECRET.trim(),
    expiresIn: (process.env.JWT_EXPIRES_IN || "12h").trim(),
  },
};
