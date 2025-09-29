import { getRouteSupabase } from "./supabase/server";

export async function createSignedUrl(bucket: string, path: string, expires = 60 * 60) {
  const sb = getRouteSupabase();
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expires);
  if (error) throw error;
  return data.signedUrl;
}
