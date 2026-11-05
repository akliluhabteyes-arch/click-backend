import { schemas } from "../validators/schemas.js";

/**
 * Every content table the website reads from, described once.
 *
 *  path         URL segment       → /api/<path>  and  /api/admin/<path>
 *  table        Supabase table name
 *  schema       zod create schema (update uses schema.partial())
 *  orderBy      sort column for listings
 *  activeColumn rows shown publicly only when this column is true
 *  slugFrom     field (or fn) used to auto-generate the slug (null = no slug column)
 *  image        optional Cloudinary image: DB columns + sub-folder
 */
export const resources = [
  {
    key: "stats",
    path: "stats",
    table: "site_stats",
    schema: schemas.stats,
    orderBy: "display_order",
    activeColumn: "is_active",
    slugFrom: "label",
  },
  {
    key: "values",
    path: "values",
    table: "company_values",
    schema: schemas.values,
    orderBy: "display_order",
    activeColumn: "is_active",
    slugFrom: "title",
  },
  {
    key: "services",
    path: "services",
    table: "services",
    schema: schemas.services,
    orderBy: "display_order",
    activeColumn: "is_active",
    slugFrom: "title",
  },
  {
    key: "solutions",
    path: "solutions",
    table: "solutions",
    schema: schemas.solutions,
    orderBy: "display_order",
    activeColumn: "is_active",
    slugFrom: "name",
    image: { urlColumn: "image_url", idColumn: "image_public_id", folder: "solutions" },
  },
  {
    key: "customers",
    path: "customers",
    table: "customers",
    schema: schemas.customers,
    orderBy: "display_order",
    activeColumn: "is_active",
    slugFrom: "name",
    image: { urlColumn: "logo_url", idColumn: "logo_public_id", folder: "customers" },
  },
  {
    key: "testimonials",
    path: "testimonials",
    table: "testimonials",
    schema: schemas.testimonials,
    orderBy: "display_order",
    activeColumn: "is_published",
    slugFrom: "client_name",
    image: { urlColumn: "avatar_url", idColumn: "avatar_public_id", folder: "testimonials" },
  },
  {
    key: "team",
    path: "team",
    table: "team_members",
    schema: schemas.team,
    orderBy: "display_order",
    activeColumn: "is_active",
    slugFrom: "full_name",
    image: { urlColumn: "image_url", idColumn: "image_public_id", folder: "team" },
  },
  {
    key: "socialLinks",
    path: "social-links",
    table: "social_links",
    schema: schemas.socialLinks,
    orderBy: "display_order",
    activeColumn: "is_active",
    slugFrom: null,
  },
  {
    key: "chatFaqs",
    path: "chat-faqs",
    table: "chat_faqs",
    schema: schemas.chatFaqs,
    orderBy: "priority",
    activeColumn: "is_active",
    slugFrom: (data) => data.keywords?.[0],
    adminOnly: true, // not listed publicly; used by POST /api/chat
  },
  {
    key: "chatQuickActions",
    path: "chat-quick-actions",
    table: "chat_quick_actions",
    schema: schemas.chatQuickActions,
    orderBy: "display_order",
    activeColumn: "is_active",
    slugFrom: "label",
  },
];

export const resourceByKey = Object.fromEntries(resources.map((r) => [r.key, r]));

// Image fields of the single-row site_settings table
export const settingsImages = {
  logo: { urlColumn: "logo_url", idColumn: "logo_public_id" },
  "hero-background": { urlColumn: "hero_background_url", idColumn: "hero_background_public_id" },
  "hero-image": { urlColumn: "hero_image_url", idColumn: "hero_image_public_id" },
  "about-image": { urlColumn: "about_image_url", idColumn: "about_image_public_id" },
  "solutions-background": {
    urlColumn: "solutions_background_url",
    idColumn: "solutions_background_public_id",
  },
};
