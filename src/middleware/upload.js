import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE_MB = 5;

// Images are kept in memory and streamed straight to Cloudinary.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(ApiError.badRequest(`Only ${ALLOWED_TYPES.join(", ")} images are allowed`));
  },
});

// Single optional image under the form field "image".
export const imageUpload = upload.single("image");
