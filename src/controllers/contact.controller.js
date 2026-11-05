import * as contactService from "../services/contact.service.js";
import { contactUpdateSchema } from "../validators/schemas.js";
import { ApiError } from "../utils/ApiError.js";
import { ok, isUuid } from "../utils/helpers.js";

const THANK_YOU = "Thank you! Your message has been received. We will get back to you within 24 hours.";

const requireUuid = (id) => {
  if (!isUuid(id)) throw ApiError.badRequest("Invalid id");
  return id;
};

// ---- public ----
export const submit = async (req, res) => {
  const { website, ...data } = req.body;

  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (website) return ok(res, { message: THANK_YOU }, 201);

  const saved = await contactService.createMessage(data, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  ok(res, { message: THANK_YOU, id: saved.id }, 201);
};

// ---- admin ----
const STATUSES = ["new", "read", "replied", "archived", "spam"];

export const list = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const status = STATUSES.includes(req.query.status) ? req.query.status : undefined;
  const search = typeof req.query.search === "string" ? req.query.search.slice(0, 100) : undefined;

  const { items, total } = await contactService.listMessages({ status, search, page, limit });
  ok(res, items, 200, { page, limit, total, pages: Math.ceil(total / limit) });
};

export const stats = async (_req, res) => ok(res, await contactService.countByStatus());

export const getOne = async (req, res) =>
  ok(res, await contactService.getMessage(requireUuid(req.params.id)));

export const update = async (req, res) => {
  const changes = contactUpdateSchema.parse(req.body ?? {});
  if (!Object.keys(changes).length) throw ApiError.badRequest("No fields to update");
  ok(res, await contactService.updateMessage(requireUuid(req.params.id), changes));
};

export const remove = async (req, res) =>
  ok(res, await contactService.deleteMessage(requireUuid(req.params.id)));
