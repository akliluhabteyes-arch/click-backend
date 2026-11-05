import app from "./app.js";
import { env } from "./config/env.js";
import { supabase } from "./config/supabase.js";
import cloudinary from "./config/cloudinary.js";

// Verifies Supabase and Cloudinary on startup and prints the result.
const checkConnections = async () => {
  const { error } = await supabase.from("site_settings").select("id").limit(1);
  console.log(
    error
      ? `✖ Supabase: connection failed — ${error.message}`
      : `✔ Supabase: database connected`
  );

  try {
    await cloudinary.api.ping();
    console.log(`✔ Cloudinary: connected (cloud "${env.cloudinary.cloudName}")`);
  } catch (err) {
    console.log(`✖ Cloudinary: connection failed — ${err.error?.message || err.message}`);
  }
};

const server = app.listen(env.port, async () => {
  console.log(`ClickAddis API running on http://localhost:${env.port} (${env.nodeEnv})`);
  await checkConnections();
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));
