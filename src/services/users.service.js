import { supabase } from "../config/supabase.js";
import { ApiError, unwrap } from "../utils/ApiError.js";
import { hashPassword } from "../utils/password.js";
import { PUBLIC_COLUMNS, setPassword } from "./auth.service.js";

/**
 * Admin account management (superadmin only).
 * The superadmin creates and manages "admin" accounts. Superadmin accounts
 * cannot be created, edited or deleted here (use scripts/create-superadmin.js).
 */
const TABLE = "admin_users";

export const listUsers = async () =>
  unwrap(
    await supabase
      .from(TABLE)
      .select(PUBLIC_COLUMNS)
      .order("role", { ascending: false }) // superadmin first
      .order("created_at", { ascending: true })
  );

const getManageableUser = async (id) => {
  const user = unwrap(await supabase.from(TABLE).select(PUBLIC_COLUMNS).eq("id", id).single());
  if (user.role === "superadmin") {
    throw ApiError.forbidden("Superadmin accounts cannot be modified from the admin panel");
  }
  return user;
};

export const createUser = async ({ username, full_name, password, is_active }, createdBy) =>
  unwrap(
    await supabase
      .from(TABLE)
      .insert({
        username,
        full_name,
        password_hash: await hashPassword(password),
        role: "admin",
        is_active: is_active ?? true,
        created_by: createdBy,
      })
      .select(PUBLIC_COLUMNS)
      .single()
  );

export const updateUser = async (id, { password, ...changes }) => {
  await getManageableUser(id);
  if (!password && !Object.keys(changes).length) throw ApiError.badRequest("No fields to update");

  let user;
  if (Object.keys(changes).length) {
    user = unwrap(
      await supabase.from(TABLE).update(changes).eq("id", id).select(PUBLIC_COLUMNS).single()
    );
  }
  if (password) user = (await setPassword(id, password)).user; // also signs that admin out
  return user;
};

export const deleteUser = async (id) => {
  await getManageableUser(id);
  unwrap(await supabase.from(TABLE).delete().eq("id", id));
  return { id };
};
