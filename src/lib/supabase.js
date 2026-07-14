import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "ideas";

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function uploadIdeaFiles(files, userId) {
  if (!supabase || !files?.length) {
    return [];
  }

  const uploadedFiles = [];

  for (const file of files) {
    const safeName = file.name
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    const path = `users/${userId}/ideas/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from(storageBucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      if (error.message?.includes("Bucket not found")) {
        throw new Error(`Supabase storage bucket "${storageBucket}" was not found. Create it in Supabase Storage and ensure it is public if you want public URLs.`);
      }
      throw error;
    }

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(path);

    uploadedFiles.push({
      path,
      publicUrl: data.publicUrl,
      mimeType: file.type,
      size: file.size,
      name: file.name,
    });
  }

  return uploadedFiles;
}
