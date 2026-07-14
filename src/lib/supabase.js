import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function uploadIdeaFile(file, userId) {
  if (!supabase || !file) {
    return null;
  }

  const safeName = file.name
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");
  const path = `users/${userId}/ideas/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from("ideas").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from("ideas").getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
  };
}
