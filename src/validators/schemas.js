import { z } from "zod";

// ---------------------------------------------------------------------------
// Field helpers — they accept both JSON values and multipart/form-data strings
// ---------------------------------------------------------------------------
const emptyToNull = (v) => (v === "" || v === "null" ? null : v);

const text = (max = 255) => z.string().trim().min(1, "Required").max(max);
const optionalText = (max = 255) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable()).optional();

const int = (min = 0, max = 1_000_000) => z.coerce.number().int().min(min).max(max);
const optionalInt = (min = 0, max = 1_000_000) =>
  z.preprocess(emptyToNull, z.coerce.number().int().min(min).max(max).nullable()).optional();

const bool = z.preprocess((v) => {
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return v;
}, z.boolean());

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may contain only lowercase letters, numbers and hyphens")
  .max(80);

const url = z.preprocess(emptyToNull, z.string().trim().max(500).nullable()).optional();
const email = z.string().trim().toLowerCase().email().max(255);
const optionalEmail = z.preprocess(emptyToNull, email.nullable()).optional();

// "erp, enterprise" | '["erp","enterprise"]' | ["erp","enterprise"]
const keywords = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* fall through to comma split */
  }
  return v.split(",");
}, z.array(z.string().trim().toLowerCase().min(1)).min(1, "At least one keyword is required"));

// Common to every content table
const base = {
  slug: slug.optional(),
  display_order: int().optional(),
  is_active: bool.optional(),
};

// ---------------------------------------------------------------------------
// Content schemas (create). Update schemas are derived with .partial().
// ---------------------------------------------------------------------------
export const schemas = {
  stats: z.object({
    ...base,
    value: int(),
    suffix: z.string().trim().max(10).optional(),
    label: text(100),
  }),

  values: z.object({
    ...base,
    title: text(100),
    description: text(500),
    icon_key: text(50),
  }),

  services: z.object({
    ...base,
    title: text(100),
    description: text(500),
    icon_key: text(50),
    show_in_footer: bool.optional(),
    footer_order: optionalInt(),
  }),

  solutions: z.object({
    ...base,
    name: text(100),
    short_description: optionalText(1000),
    icon_key: text(50),
    gradient_classes: text(200),
    show_in_footer: bool.optional(),
    footer_order: optionalInt(),
  }),

  customers: z.object({
    ...base,
    name: text(150),
    icon: optionalText(16),
    industry: optionalText(100),
    website_url: url,
  }),

  testimonials: z.object({
    slug: slug.optional(),
    display_order: int().optional(),
    is_published: bool.optional(),
    customer_id: z.preprocess(emptyToNull, z.string().uuid().nullable()).optional(),
    client_name: text(150),
    author_name: optionalText(150),
    author_role: text(100),
    icon: optionalText(16),
    quote: text(2000),
    rating: int(1, 5).optional(),
  }),

  team: z.object({
    ...base,
    full_name: text(150),
    role: text(100),
    bio: optionalText(2000),
    email: optionalEmail,
    linkedin_url: url,
    telegram_url: url,
    instagram_url: url,
  }),

  socialLinks: z.object({
    platform: slug,
    label: text(50),
    url: text(500),
    display_order: int().optional(),
    is_active: bool.optional(),
  }),

  chatFaqs: z.object({
    slug: slug.optional(),
    keywords,
    response: text(5000),
    priority: int().optional(),
    is_active: bool.optional(),
  }),

  chatQuickActions: z.object({
    ...base,
    label: text(50),
    query: text(200),
  }),
};

// ---------------------------------------------------------------------------
// Site settings (single row) — every field optional on update
// ---------------------------------------------------------------------------
export const settingsSchema = z
  .object({
    company_name: text(100),
    legal_name: text(150),
    tagline: optionalText(255),
    short_description: optionalText(1000),
    address_line1: text(255),
    address_line2: optionalText(255),
    city: text(100),
    country: text(100),
    phone: text(50),
    email,
    support_email: optionalEmail,
    working_hours: optionalText(150),
    timezone: text(64),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    map_zoom: int(1, 21),
    chat_bot_name: text(100),
    chat_welcome_message: text(5000),
    chat_default_response: text(5000),
  })
  .partial()
  .strict();

// ---------------------------------------------------------------------------
// Contact form & chat
// ---------------------------------------------------------------------------
export const contactSchema = z
  .object({
    // the current frontend form sends "name"; "full_name" is also accepted
    full_name: z.string().trim().min(1).max(150).optional(),
    name: z.string().trim().min(1).max(150).optional(),
    email,
    phone: optionalText(50),
    company: optionalText(150),
    subject: optionalText(200),
    message: z.string().trim().min(5, "Message is too short").max(5000),
    source: z.enum(["contact_form", "demo_request", "chat_widget"]).optional(),
    website: z.string().optional(), // honeypot — must stay empty
  })
  .refine((d) => d.full_name || d.name, { message: "Name is required", path: ["name"] })
  .transform(({ name, full_name, ...rest }) => ({ ...rest, full_name: full_name || name }));

export const contactUpdateSchema = z
  .object({
    status: z.enum(["new", "read", "replied", "archived", "spam"]).optional(),
    admin_notes: optionalText(5000),
  })
  .strict();

export const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(1000),
});

// ---------------------------------------------------------------------------
// Admin auth & accounts
// ---------------------------------------------------------------------------
const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,50}$/, "Username: 3–50 characters, letters, numbers, dot, dash or underscore");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({ current_password: z.string().min(1, "Current password is required"), new_password: password })
  .refine((d) => d.current_password !== d.new_password, {
    message: "New password must be different from the current one",
    path: ["new_password"],
  });

export const userCreateSchema = z
  .object({ username, full_name: text(150), password, is_active: bool.optional() })
  .strict();

export const userUpdateSchema = z
  .object({ full_name: text(150), password, is_active: bool })
  .partial()
  .strict();
