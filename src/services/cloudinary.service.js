import cloudinary from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Uploads an in-memory image buffer to Cloudinary.
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = (buffer, subFolder, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.cloudinary.folder}/${subFolder}`,
        resource_type: "image",
        overwrite: true,
        ...options,
      },
      (error, result) => {
        if (error) return reject(new ApiError(502, "Image upload failed", error.message));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

/** Deletes an image; never throws (a missing remote image must not break a request). */
export const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    console.warn(`[cloudinary] Could not delete ${publicId}: ${error.message}`);
  }
};
