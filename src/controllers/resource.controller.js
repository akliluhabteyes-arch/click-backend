import * as content from "../services/content.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ok, isUuid } from "../utils/helpers.js";

const requireUuid = (id) => {
  if (!isUuid(id)) throw ApiError.badRequest("Invalid id");
  return id;
};

const wantsImageRemoval = (body) => body?.remove_image === true || body?.remove_image === "true";

/** Builds the controller set for one resource from config/resources.js */
export const resourceController = (resource) => {
  const updateSchema = resource.schema.partial();

  return {
    listPublic: async (_req, res) => {
      res.set("Cache-Control", "public, max-age=60");
      ok(res, await content.listPublic(resource));
    },

    listAll: async (_req, res) => ok(res, await content.listAll(resource)),

    getOne: async (req, res) => ok(res, await content.getById(resource, requireUuid(req.params.id))),

    create: async (req, res) => {
      const data = resource.schema.parse(req.body ?? {});
      ok(res, await content.create(resource, data, req.file), 201);
    },

    update: async (req, res) => {
      const id = requireUuid(req.params.id);
      const removeImage = wantsImageRemoval(req.body);
      const { remove_image: _ignored, ...body } = req.body ?? {};
      const data = updateSchema.parse(body);
      ok(res, await content.update(resource, id, data, { file: req.file, removeImage }));
    },

    remove: async (req, res) => ok(res, await content.remove(resource, requireUuid(req.params.id))),
  };
};
