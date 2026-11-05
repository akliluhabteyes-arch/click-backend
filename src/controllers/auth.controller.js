import * as authService from "../services/auth.service.js";
import { ok } from "../utils/helpers.js";

export const login = async (req, res) =>
  ok(res, await authService.login(req.body.username, req.body.password));

export const me = async (req, res) => ok(res, req.user);

export const changePassword = async (req, res) =>
  ok(
    res,
    await authService.changePassword(req.user.id, req.body.current_password, req.body.new_password)
  );
