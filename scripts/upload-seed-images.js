/**
 * One-time helper: uploads the images currently bundled in the frontend
 * (Frontend/src/assets) to Cloudinary and stores the URLs in Supabase.
 *
 *   npm run seed:images
 *
 * Safe to re-run: fixed public_ids are overwritten, not duplicated.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { supabase } from "../src/config/supabase.js";
import { uploadImage } from "../src/services/cloudinary.service.js";

const ASSETS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../Frontend/src/assets");

const TEAM = {
  "getacher-aychiluhum": "team2.jpg",
  "abdu-adem": "team5.jpg",
  "biruk-nesibu": "Abu.jpg",
  "mesfin-aychiluhum": "Mesf.jpg",
  "venus-h-meskel": "team4.jpg",
};

// site_settings image columns → asset file
const SITE = {
  logo: { file: "clickaddis-logo.png", url: "logo_url", id: "logo_public_id" },
  "hero-background": { file: "hero-bg.jpg", url: "hero_background_url", id: "hero_background_public_id" },
  "hero-image": { file: "laptop-dashboard.jpg", url: "hero_image_url", id: "hero_image_public_id" },
  "about-image": { file: "laptop-dashboard.jpg", url: "about_image_url", id: "about_image_public_id" },
  "solutions-background": {
    file: "tech-pattern.jpg",
    url: "solutions_background_url",
    id: "solutions_background_public_id",
  },
};

const upload = async (file, folder, publicId) => {
  const buffer = await fs.readFile(path.join(ASSETS, file));
  return uploadImage(buffer, folder, { public_id: publicId });
};

const run = async () => {
  console.log(`Reading images from ${ASSETS}\n`);

  for (const [slug, file] of Object.entries(TEAM)) {
    const { url, publicId } = await upload(file, "team", slug);
    const { error } = await supabase
      .from("team_members")
      .update({ image_url: url, image_public_id: publicId })
      .eq("slug", slug);
    if (error) throw error;
    console.log(`✔ team/${slug}  ←  ${file}`);
  }

  const settings = {};
  for (const [key, cfg] of Object.entries(SITE)) {
    const { url, publicId } = await upload(cfg.file, "site", key);
    settings[cfg.url] = url;
    settings[cfg.id] = publicId;
    console.log(`✔ site/${key}  ←  ${cfg.file}`);
  }
  const { error } = await supabase.from("site_settings").update(settings).eq("id", 1);
  if (error) throw error;

  console.log("\nDone. All images are on Cloudinary and linked in the database.");
};

run().catch((err) => {
  console.error("\n✖ Seeding images failed:", err.message || err);
  process.exit(1);
});
