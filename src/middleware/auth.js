import { verifyToken } from "../services/auth.service.js";
import { ApiError } from "../utils/ApiError.js";

// Requires "Authorization: Bearer <token>" from an active admin or superadmin.
export const requireAdmin = async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) throw ApiError.unauthorized();
  req.user = await verifyToken(token);
  next();
};

// Must be used after requireAdmin.
export const requireSuperadmin = (req, _res, next) => {
  if (req.user?.role !== "superadmin") {
    throw ApiError.forbidden("Only the superadmin can manage admin accounts");
  }
  next();
};
