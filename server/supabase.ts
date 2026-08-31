import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const BUCKET = "norshell-media";
let client: ReturnType<typeof createClient> | undefined;

function getClient() {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase Storage is not configured.");
    client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}

export async function ensureNorshellMediaBucket() {
  const supabase = getClient();
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "10MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  if (error && !/already exists|duplicate/i.test(error.message)) {
    throw new Error(`Unable to prepare media storage: ${error.message}`);
  }
}

export async function uploadNorshellMedia(
  file: Uint8Array,
  fileName: string,
  contentType: "image/jpeg" | "image/png" | "image/webp",
  folder: "products" | "highlights" | "story",
) {
  await ensureNorshellMediaBucket();
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const baseName = fileName.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/-+/g, "-").slice(0, 80) || "image";
  const storageKey = `${folder}/${baseName}-${randomUUID()}.${extension}`;
  const supabase = getClient();
  const { error } = await supabase.storage.from(BUCKET).upload(storageKey, file, {
    cacheControl: "3600",
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Unable to upload image: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storageKey);
  return { storageKey, url: data.publicUrl };
}

export async function deleteNorshellMedia(storageKey?: string | null) {
  if (!storageKey) return;
  const supabase = getClient();
  await supabase.storage.from(BUCKET).remove([storageKey]);
}

/**
 * Verifies a Supabase access token (sent by the client after
 * supabase.auth.signInWithPassword) and returns the underlying Supabase
 * auth user, or null if the token is missing/invalid/expired.
 */
export async function getSupabaseUserFromToken(token: string) {
  if (!token) return null;
  const supabase = getClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
