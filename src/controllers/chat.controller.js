import * as chatService from "../services/chat.service.js";
import { ok } from "../utils/helpers.js";

export const getConfig = async (_req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  ok(res, await chatService.getChatConfig());
};

export const sendMessage = async (req, res) => ok(res, await chatService.getReply(req.body.message));
