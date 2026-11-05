# ClickAddis Backend

REST API for the ClickAddis website. **Node.js + Express 5**, **Supabase** (PostgreSQL) for data, **Cloudinary** for images, username/password admin accounts with JWT. Also serves the Admin panel at `/admin`.

## Structure

```
Backend/
├── database/
│   ├── clickaddis_schema.sql        # 1. tables, security rules, seed data
│   └── 002_admin_users.sql          # 2. admin accounts + team social links
├── scripts/
│   ├── upload-seed-images.js        # uploads current site images to Cloudinary
│   └── create-superadmin.js         # creates / resets the superadmin
└── src/
    ├── server.js                    # starts the HTTP server
    ├── app.js                       # express setup (security, CORS, logging, routes)
    ├── config/
    │   ├── env.js                   # loads & validates .env
    │   ├── supabase.js              # Supabase client (service role)
    │   ├── cloudinary.js            # Cloudinary client
    │   └── resources.js             # the content tables, defined once
    ├── middleware/                  # auth, upload, validation, rate limits, errors
    ├── validators/schemas.js        # request validation (zod)
    ├── services/                    # database & Cloudinary logic
    ├── controllers/                 # HTTP request handlers
    ├── routes/                      # public, auth and admin routes
    └── utils/                       # ApiError, helpers
```

## Setup

1. **Install** — `npm install` (Node 18.18+)
2. **Environment** — fill in `.env` (template: `.env.example`):
   - Supabase → *Project Settings → API*: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (service_role — keep it secret)
   - Cloudinary → *Dashboard*: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `JWT_SECRET` — a long random string (command in `.env.example`)
3. **Database** — Supabase → *SQL Editor* → run `database/clickaddis_schema.sql`, then `database/002_admin_users.sql`
4. **Images** — `npm run seed:images` (uploads team photos, logo, hero/about images from `Frontend/src/assets` and saves the URLs)
5. **Superadmin** — `npm run create:superadmin -- <username> <password> "<Full Name>"` (run again to reset the password)
6. **Run** — `npm run dev` (auto-reload) or `npm start`
   - API: `http://localhost:5000/api/health`
   - Admin panel: `http://localhost:5000/admin`

## Roles

| | Superadmin | Admin |
|---|---|---|
| Manage all website content, images, settings, messages | ✔ | ✔ |
| Change own password | ✔ | ✔ |
| Create admins, reset their passwords, activate / deactivate, delete | ✔ | ✖ |

Deactivating an admin or resetting their password signs them out immediately (every request re-checks the account).

## Response format

```json
{ "success": true,  "data": { ... }, "meta": { ... } }
{ "success": false, "error": { "message": "Validation failed", "details": [ { "field": "email", "message": "..." } ] } }
```

## Public endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | API + database status |
| GET | `/api/site` | **Everything the website needs in one call** (settings, stats, values, services, solutions, customers, testimonials, team, social links, footer, chat config) |
| GET | `/api/settings` | Company info, contact details, map, images |
| GET | `/api/stats` · `/api/values` · `/api/services` · `/api/solutions` · `/api/customers` · `/api/testimonials` · `/api/team` · `/api/social-links` · `/api/chat-quick-actions` | Active items, sorted |
| GET | `/api/chat/config` | Bot name, welcome message, quick actions |
| POST | `/api/chat` | `{ "message": "pricing" }` → `{ "reply", "matched" }` |
| POST | `/api/contact` | `{ "name", "email", "message", "phone?", "company?", "subject?" }` — limited to 5 per 15 min per IP |

## Auth

| Method | Path | Body |
|---|---|---|
| POST | `/api/auth/login` | `{ "username", "password" }` → `token`, `expires_at`, `user` (10 attempts / 15 min) |
| GET | `/api/auth/me` | — |
| POST | `/api/auth/change-password` | `{ "current_password", "new_password" }` → new `token` |

Admin requests send `Authorization: Bearer <token>`. Tokens last `JWT_EXPIRES_IN` (default 12h).

## Admin endpoints (`/api/admin`, token required)

**Admin accounts** (superadmin only)

| Method | Path | Body |
|---|---|---|
| GET | `/api/admin/users` | — |
| POST | `/api/admin/users` | `{ "username", "full_name", "password", "is_active?" }` — always creates role `admin` |
| PATCH | `/api/admin/users/:id` | `{ "full_name?", "is_active?", "password?" }` |
| DELETE | `/api/admin/users/:id` | — |

Superadmin accounts cannot be changed through the API (use `npm run create:superadmin`).

**Content** — the same 5 routes for every `<resource>`:
`stats`, `values`, `services`, `solutions`, `customers`, `testimonials`, `team`, `social-links`, `chat-faqs`, `chat-quick-actions`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/<resource>` | All rows, including inactive ones |
| POST | `/api/admin/<resource>` | JSON, or `multipart/form-data` with an `image` file for `team`, `customers`, `testimonials`, `solutions`. `slug` is generated automatically if left out. |
| GET | `/api/admin/<resource>/:id` | |
| PATCH | `/api/admin/<resource>/:id` | Partial update. Send a new `image` to replace it (the old one is deleted from Cloudinary) or `remove_image=true` to remove it. |
| DELETE | `/api/admin/<resource>/:id` | Also deletes its Cloudinary image |

**Settings**

| Method | Path |
|---|---|
| GET / PATCH | `/api/admin/settings` |
| POST / DELETE | `/api/admin/settings/images/:key` — key: `logo`, `hero-background`, `hero-image`, `about-image`, `solutions-background` |

**Contact messages**

| Method | Path |
|---|---|
| GET | `/api/admin/contact-messages?status=new&search=jo&page=1&limit=20` |
| GET | `/api/admin/contact-messages/stats` — counts per status |
| GET / PATCH / DELETE | `/api/admin/contact-messages/:id` — PATCH `{ "status": "replied", "admin_notes": "..." }` |

**Uploads**

| Method | Path |
|---|---|
| POST | `/api/admin/uploads?folder=misc` — any image → `{ url, public_id }` |
| DELETE | `/api/admin/uploads` — `{ "public_id" }` |

Images: JPEG, PNG, WebP, GIF or AVIF, max 5 MB.

## Example

```bash
# login
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"..."}'

# add a team member with a photo
curl -X POST http://localhost:5000/api/admin/team -H "Authorization: Bearer <token>" \
  -F full_name="New Person" -F role="Programmer" -F display_order=6 -F image=@photo.jpg
```

## Security

- The service-role key never leaves the server; the database's row-level security blocks direct public writes.
- Helmet security headers, CORS allow-list (`CORS_ORIGINS`), request size limits, rate limits on the whole API, contact, chat and login.
- Contact form has a hidden honeypot field (`website`) against bots.
