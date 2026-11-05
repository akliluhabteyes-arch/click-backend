import { supabase } from "../config/supabase.js";
import { unwrap } from "../utils/ApiError.js";

const TABLE = "contact_messages";

export const createMessage = async (data, meta) =>
  unwrap(
    await supabase
      .from(TABLE)
      .insert({ ...data, ip_address: meta.ip || null, user_agent: meta.userAgent || null })
      .select("id, created_at")
      .single()
  );

export const listMessages = async ({ status, search, page, limit }) => {
  const from = (page - 1) * limit;
  let query = supabase
    .from(TABLE)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (status) query = query.eq("status", status);
  if (search) {
    const term = search.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  unwrap({ data, error });
  return { items: data, total: count ?? 0 };
};

export const getMessage = async (id) =>
  unwrap(await supabase.from(TABLE).select("*").eq("id", id).single());

export const updateMessage = async (id, changes) => {
  const payload = { ...changes };
  if (payload.status === "replied") payload.replied_at = new Date().toISOString();
  return unwrap(
    await supabase.from(TABLE).update(payload).eq("id", id).select("*").single()
  );
};

export const deleteMessage = async (id) => {
  await getMessage(id); // 404 if missing
  unwrap(await supabase.from(TABLE).delete().eq("id", id));
  return { id };
};

export const countByStatus = async () => {
  const statuses = ["new", "read", "replied", "archived", "spam"];
  const counts = await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabase
        .from(TABLE)
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      unwrap({ data: null, error });
      return [status, count ?? 0];
    })
  );
  return Object.fromEntries(counts);
};
