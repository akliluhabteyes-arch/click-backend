import { getSitePayload } from "../services/site.service.js";
import * as settingsService from "../services/settings.service.js";
import { settingsSchema } from "../validators/schemas.js";
import { ok } from "../utils/helpers.js";

// ---- public ----
export const getSite = async (_req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  ok(res, await getSitePayload());
};

export const getPublicSettings = async (_req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  ok(res, await settingsService.getSettings());
};

// ---- admin ----
export const getSettings = async (_req, res) => ok(res, await settingsService.getSettings());

export const updateSettings = async (req, res) =>
  ok(res, await settingsService.updateSettings(settingsSchema.parse(req.body ?? {})));

export const uploadSettingsImage = async (req, res) =>
  ok(res, await settingsService.setSettingsImage(req.params.key, req.file));

export const deleteSettingsImage = async (req, res) =>
  ok(res, await settingsService.removeSettingsImage(req.params.key));
