import { supabase } from "../config/supabase.js";
import { settingsImages } from "../config/resources.js";
import { ApiError, unwrap } from "../utils/ApiError.js";
import { uploadImage, deleteImage } from "./cloudinary.service.js";

const TABLE = "site_settings";
const ROW_ID = 1;

export const getSettings = async () =>
  unwrap(await supabase.from(TABLE).select("*").eq("id", ROW_ID).single());

export const updateSettings = async (changes) => {
  if (!Object.keys(changes).length) throw ApiError.badRequest("No fields to update");
  return unwrap(
    await supabase.from(TABLE).update(changes).eq("id", ROW_ID).select("*").single()
  );
};

const imageField = (key) => {
  const field = settingsImages[key];
  if (!field) {
    throw ApiError.badRequest(
      `Unknown image "${key}". Use one of: ${Object.keys(settingsImages).join(", ")}`
    );
  }
  return field;
};

export const setSettingsImage = async (key, file) => {
  const { urlColumn, idColumn } = imageField(key);
  if (!file) throw ApiError.badRequest('An image file is required (form field "image")');

  const current = await getSettings();
  const uploaded = await uploadImage(file.buffer, "site", { public_id: key });

  const updated = await updateSettings({ [urlColumn]: uploaded.url, [idColumn]: uploaded.publicId });
  if (current[idColumn] && current[idColumn] !== uploaded.publicId) {
    await deleteImage(current[idColumn]);
  }
  return updated;
};

export const removeSettingsImage = async (key) => {
  const { urlColumn, idColumn } = imageField(key);
  const current = await getSettings();
  const updated = await updateSettings({ [urlColumn]: null, [idColumn]: null });
  await deleteImage(current[idColumn]);
  return updated;
};
