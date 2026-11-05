import * as usersService from "../services/users.service.js";
import { userCreateSchema, userUpdateSchema } from "../validators/schemas.js";
import { ApiError } from "../utils/ApiError.js";
import { ok, isUuid } from "../utils/helpers.js";

const requireUuid = (id) => {
  if (!isUuid(id)) throw ApiError.badRequest("Invalid id");
  return id;
};

export const list = async (_req, res) => ok(res, await usersService.listUsers());

export const create = async (req, res) =>
  ok(res, await usersService.createUser(userCreateSchema.parse(req.body ?? {}), req.user.id), 201);

export const update = async (req, res) =>
  ok(
    res,
    await usersService.updateUser(requireUuid(req.params.id), userUpdateSchema.parse(req.body ?? {}))
  );

export const remove = async (req, res) =>
  ok(res, await usersService.deleteUser(requireUuid(req.params.id)));
