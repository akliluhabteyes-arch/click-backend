import { uploadImage, deleteImage } from "../services/cloudinary.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ok, slugify } from "../utils/helpers.js";
import { env } from "../config/env.js";

// Generic image upload for anything not tied to a specific record.
export const upload = async (req, res) => {
  if (!req.file) throw ApiError.badRequest('An image file is required (form field "image")');
  const folder = slugify(req.query.folder || "misc") || "misc";
  const { url, publicId } = await uploadImage(req.file.buffer, folder);
  ok(res, { url, public_id: publicId }, 201);
};

export const remove = async (req, res) => {
  const publicId = req.body?.public_id;
  if (!publicId || typeof publicId !== "string") throw ApiError.badRequest("public_id is required");
  if (!publicId.startsWith(`${env.cloudinary.folder}/`)) {
    throw ApiError.badRequest(`Only images inside "${env.cloudinary.folder}/" can be deleted`);
  }
  await deleteImage(publicId);
  ok(res, { public_id: publicId });
};
