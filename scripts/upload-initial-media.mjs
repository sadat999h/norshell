import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");

const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const bucket = "norshell-media";
const assetDir = "/home/ubuntu/webdev-static-assets/norshell";
const assets = [
  ["brand/norshell-wordmark.jpg", "651875954_122128221165008680_2231575073597638091_n.jpg", "image/jpeg"],
  ["collection/paired-leather-bags.png", "IMG_5520.PNG", "image/png"],
  ["collection/sunlit-table.jpg", "IMG_5764.JPG.jpeg", "image/jpeg"],
  ["story/quiet-stay.jpg", "IMG_7271.JPG.jpeg", "image/jpeg"],
  ["highlights/nore-campaign.jpg", "IMG_7286.JPG.jpeg", "image/jpeg"],
  ["products/black-commute.webp", "IMG_7269.JPG.webp", "image/webp"],
  ["products/cafe-set.webp", "IMG_5316.webp", "image/webp"],
];

const { error: bucketError } = await client.storage.createBucket(bucket, {
  public: true,
  fileSizeLimit: "10MB",
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
});
if (bucketError && !/already exists|duplicate/i.test(bucketError.message)) {
  throw new Error(`Could not create the Supabase media bucket: ${bucketError.message}`);
}

const uploaded = [];
for (const [storageKey, fileName, contentType] of assets) {
  const data = await readFile(join(assetDir, fileName));
  const { error } = await client.storage.from(bucket).upload(storageKey, data, { contentType, cacheControl: "3600", upsert: true });
  if (error) throw new Error(`Could not upload ${basename(fileName)}: ${error.message}`);
  const { data: publicUrl } = client.storage.from(bucket).getPublicUrl(storageKey);
  uploaded.push({ storageKey, url: publicUrl.publicUrl });
}

console.log(JSON.stringify(uploaded, null, 2));
