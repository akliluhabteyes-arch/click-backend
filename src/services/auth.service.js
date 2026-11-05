import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { ApiError, unwrap } from "../utils/ApiError.js";
import { hashPassword, verifyPassword, DUMMY_HASH } from "../utils/password.js";

const TABLE = "admin_users";
export const PUBLIC_COLUMNS =
  "id, username, full_name, role, is_active, last_login_at, created_by, created_at, updated_at";

const signToken = (user) => {
  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
  const { exp } = jwt.decode(token);
  return { token, expires_at: exp };
};

export const login = async (username, password) => {
  const { data: user, error } = await supabase
    .from(TABLE)
    .select(`${PUBLIC_COLUMNS}, password_hash`)
    .eq("username", username)
    .maybeSingle();
  unwrap({ data: user, error });

  // Always run a hash comparison so timing doesn't reveal whether the username exists
  const valid = await verifyPassword(password, user?.password_hash || DUMMY_HASH);
  if (!user || !valid) throw ApiError.unauthorized("Invalid username or password");
  if (!user.is_active) throw ApiError.forbidden("This account has been deactivated");

  const { data: updated } = await supabase
    .from(TABLE)
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id)
    .select(PUBLIC_COLUMNS)
    .single();

  return { ...signToken(user), user: updated || user };
};

/**
 * Verifies a token and returns the CURRENT user from the database, so that
 * deactivation and password changes take effect immediately.
 */
export const verifyToken = async (token) => {
  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch {
    throw ApiError.unauthorized("Invalid or expired session, please log in again");
  }

  const { data: user, error } = await supabase
    .from(TABLE)
    .select(`${PUBLIC_COLUMNS}, password_changed_at`)
    .eq("id", payload.sub)
    .maybeSingle();
  unwrap({ data: user, error });

  if (!user) throw ApiError.unauthorized("Account no longer exists");
  if (!user.is_active) throw ApiError.unauthorized("This account has been deactivated");

  // Tokens issued before the last password change are revoked
  const changedAt = Math.floor(new Date(user.password_changed_at).getTime() / 1000);
  if (payload.iat < changedAt) throw ApiError.unauthorized("Password changed, please log in again");

  const { password_changed_at: _omit, ...safeUser } = user;
  return safeUser;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = unwrap(
    await supabase.from(TABLE).select("id, password_hash").eq("id", userId).single()
  );
  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    throw ApiError.badRequest("Current password is incorrect");
  }
  return setPassword(userId, newPassword);
};

/** Sets a new password and revokes all existing sessions; returns a fresh session. */
export const setPassword = async (userId, newPassword) => {
  // one second back-dating keeps the token issued below valid (iat has 1s resolution)
  const changedAt = new Date(Math.floor(Date.now() / 1000) * 1000).toISOString();
  const updated = unwrap(
    await supabase
      .from(TABLE)
      .update({ password_hash: await hashPassword(newPassword), password_changed_at: changedAt })
      .eq("id", userId)
      .select(PUBLIC_COLUMNS)
      .single()
  );
  return { ...signToken(updated), user: updated };
};
