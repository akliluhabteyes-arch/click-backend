import { supabase } from "../config/supabase.js";
import { ApiError, unwrap } from "../utils/ApiError.js";
import { slugify } from "../utils/helpers.js";
import { uploadImage, deleteImage } from "./cloudinary.service.js";

/**
 * Generic CRUD for the content tables described in config/resources.js.
 */

const sortedQuery = (resource, query) =>
  query
    .order(resource.orderBy, { ascending: true })
    .order("created_at", { ascending: true });

/** Public listing: only active / published rows. */
export const listPublic = async (resource) =>
  unwrap(
    await sortedQuery(
      resource,
      supabase.from(resource.table).select("*").eq(resource.activeColumn, true)
    )
  );

/** Admin listing: every row. */
export const listAll = async (resource) =>
  unwrap(await sortedQuery(resource, supabase.from(resource.table).select("*")));

export const getById = async (resource, id) =>
  unwrap(await supabase.from(resource.table).select("*").eq("id", id).single());

/** Builds a unique slug: "abdu-adem", then "abdu-adem-2", "abdu-adem-3", ... */
const uniqueSlug = async (resource, source) => {
  const baseSlug = slugify(source) || "item";
  const rows = unwrap(
    await supabase.from(resource.table).select("slug").like("slug", `${baseSlug}%`)
  );
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(baseSlug)) return baseSlug;
  let n = 2;
  while (taken.has(`${baseSlug}-${n}`)) n += 1;
  return `${baseSlug}-${n}`;
};

const slugSource = (resource, data) =>
  typeof resource.slugFrom === "function" ? resource.slugFrom(data) : data[resource.slugFrom];

export const create = async (resource, data, file) => {
  const row = { ...data };

  if (resource.slugFrom && !row.slug) {
    row.slug = await uniqueSlug(resource, slugSource(resource, row));
  }

  let uploaded;
  if (file) {
    if (!resource.image) throw ApiError.badRequest("This resource does not accept images");
    uploaded = await uploadImage(file.buffer, resource.image.folder);
    row[resource.image.urlColumn] = uploaded.url;
    row[resource.image.idColumn] = uploaded.publicId;
  }

  const result = await supabase.from(resource.table).insert(row).select("*").single();
  if (result.error && uploaded) await deleteImage(uploaded.publicId); // roll back the upload
  return unwrap(result);
};

/**
 * Updates a row. Supports replacing the image (file) or removing it (removeImage).
 * The previous Cloudinary image is deleted only after the DB update succeeds.
 */
export const update = async (resource, id, data, { file, removeImage } = {}) => {
  const current = await getById(resource, id);
  const changes = { ...data };
  let uploaded;

  if (resource.image && (file || removeImage)) {
    const { urlColumn, idColumn, folder } = resource.image;
    if (file) {
      uploaded = await uploadImage(file.buffer, folder);
      changes[urlColumn] = uploaded.url;
      changes[idColumn] = uploaded.publicId;
    } else {
      changes[urlColumn] = null;
      changes[idColumn] = null;
    }
  } else if (file) {
    throw ApiError.badRequest("This resource does not accept images");
  }

  if (!Object.keys(changes).length) throw ApiError.badRequest("No fields to update");

  const result = await supabase
    .from(resource.table)
    .update(changes)
    .eq("id", id)
    .select("*")
    .single();

  if (result.error) {
    if (uploaded) await deleteImage(uploaded.publicId);
    return unwrap(result);
  }

  const oldPublicId = resource.image && current[resource.image.idColumn];
  if (oldPublicId && oldPublicId !== result.data[resource.image.idColumn]) {
    await deleteImage(oldPublicId);
  }
  return result.data;
};

export const remove = async (resource, id) => {
  const current = await getById(resource, id);
  unwrap(await supabase.from(resource.table).delete().eq("id", id));
  if (resource.image) await deleteImage(current[resource.image.idColumn]);
  return { id };
};
