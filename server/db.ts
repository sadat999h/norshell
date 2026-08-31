import { asc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { brandStories, categories, highlights, InsertUser, productImages, products, storeSettings, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { deleteNorshellMedia } from "./supabase";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // `prepare: false` is required when DATABASE_URL points at Supabase's
      // connection pooler in transaction mode (the recommended mode for
      // serverless platforms like Vercel), since pgbouncer doesn't support
      // prepared statements. Harmless against a direct connection too.
      const client = postgres(process.env.DATABASE_URL, { prepare: false });
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (ENV.adminEmail && user.email === ENV.adminEmail) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

type MediaInput = { storageKey?: string | null; url: string; altText?: string | null };
type ProductInput = {
  name: string; slug: string; categoryId?: number | null; status: "available" | "upcoming";
  price?: number | null; material?: string | null; shortDescription?: string | null;
  description?: string | null; care?: string | null; isFeatured?: boolean; displayOrder?: number;
  images: MediaInput[];
};

function normalizeProduct(input: ProductInput) {
  return {
    name: input.name,
    slug: input.slug,
    categoryId: input.categoryId ?? null,
    status: input.status,
    price: input.price ?? null,
    material: input.material ?? null,
    shortDescription: input.shortDescription ?? null,
    description: input.description ?? null,
    care: input.care ?? null,
    isFeatured: Boolean(input.isFeatured),
    displayOrder: input.displayOrder ?? 0,
  };
}

async function cleanUpMediaKeys(storageKeys: Array<string | null | undefined>) {
  await Promise.all(storageKeys.filter((key): key is string => Boolean(key)).map(key => deleteNorshellMedia(key).catch(error => {
    console.warn(`[Storage] Could not remove obsolete media ${key}:`, error);
  })));
}

async function getImagesForProducts(productIds: number[]) {
  const db = await requireDb();
  if (!productIds.length) return new Map<number, Array<{ id: number; url: string; storageKey: string | null; altText: string | null }>>();
  const rows = await db.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.displayOrder));
  const grouped = new Map<number, Array<{ id: number; url: string; storageKey: string | null; altText: string | null }>>();
  rows.forEach(image => {
    const groupedImages = grouped.get(image.productId) ?? [];
    groupedImages.push({ id: image.id, url: image.url, storageKey: image.storageKey, altText: image.altText });
    grouped.set(image.productId, groupedImages);
  });
  return grouped;
}

export async function getStorefrontData() {
  const db = await getDb();
  if (!db) return { settings: null, categories: [], products: [], highlights: [], brandStory: null };
  const [settings] = await db.select().from(storeSettings).limit(1);
  const categoryRows = await db.select().from(categories).orderBy(asc(categories.displayOrder), asc(categories.name));
  const productRows = await db
    .select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(products.displayOrder), asc(products.name));
  const images = await getImagesForProducts(productRows.map(row => row.product.id));
  const highlightRows = await db.select().from(highlights).orderBy(asc(highlights.displayOrder));
  const [brandStory] = await db.select().from(brandStories).limit(1);
  return {
    settings: settings ?? null,
    categories: categoryRows,
    products: productRows.map(row => ({ ...row.product, categoryName: row.categoryName, categorySlug: row.categorySlug, images: images.get(row.product.id) ?? [] })),
    highlights: highlightRows,
    brandStory: brandStory ?? null,
  };
}

export async function createCategory(input: { name: string; slug: string; description?: string | null; displayOrder?: number }) {
  const db = await requireDb();
  const [result] = await db.insert(categories).values({ ...input, description: input.description ?? null, displayOrder: input.displayOrder ?? 0 }).returning({ id: categories.id });
  return { id: result.id };
}

export async function updateCategory(id: number, input: { name: string; slug: string; description?: string | null; displayOrder?: number }) {
  const db = await requireDb();
  await db.update(categories).set({ ...input, description: input.description ?? null, displayOrder: input.displayOrder ?? 0 }).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await requireDb();
  await db.delete(categories).where(eq(categories.id, id));
}

export async function createProduct(input: ProductInput) {
  const db = await requireDb();
  return db.transaction(async tx => {
    const [result] = await tx.insert(products).values(normalizeProduct(input)).returning({ id: products.id });
    const productId = result.id;
    if (input.images.length) {
      await tx.insert(productImages).values(input.images.map((image, displayOrder) => ({ productId, storageKey: image.storageKey ?? null, url: image.url, altText: image.altText ?? null, displayOrder })));
    }
    return { id: productId };
  });
}

export async function updateProduct(id: number, input: ProductInput) {
  const db = await requireDb();
  const existingImages = await db.select().from(productImages).where(eq(productImages.productId, id));
  await db.transaction(async tx => {
    await tx.update(products).set(normalizeProduct(input)).where(eq(products.id, id));
    await tx.delete(productImages).where(eq(productImages.productId, id));
    if (input.images.length) {
      await tx.insert(productImages).values(input.images.map((image, displayOrder) => ({ productId: id, storageKey: image.storageKey ?? null, url: image.url, altText: image.altText ?? null, displayOrder })));
    }
  });
  const retainedKeys = new Set(input.images.map(image => image.storageKey).filter(Boolean));
  await cleanUpMediaKeys(existingImages.map(image => image.storageKey).filter(key => !retainedKeys.has(key)));
}

export async function deleteProduct(id: number) {
  const db = await requireDb();
  const existingImages = await db.select().from(productImages).where(eq(productImages.productId, id));
  await db.delete(products).where(eq(products.id, id));
  await cleanUpMediaKeys(existingImages.map(image => image.storageKey));
}

export async function saveHighlight(input: { id?: number; eyebrow?: string | null; heading: string; body?: string | null; imageKey?: string | null; imageUrl: string; altText?: string | null; displayOrder?: number }) {
  const db = await requireDb();
  const { id, ...rest } = input;
  const values = { ...rest, eyebrow: rest.eyebrow ?? null, body: rest.body ?? null, imageKey: rest.imageKey ?? null, altText: rest.altText ?? null, displayOrder: rest.displayOrder ?? 0 };
  if (id) {
    const [existing] = await db.select().from(highlights).where(eq(highlights.id, id)).limit(1);
    await db.update(highlights).set(values).where(eq(highlights.id, id));
    if (existing?.imageKey !== values.imageKey) await cleanUpMediaKeys([existing?.imageKey]);
    return { id };
  }
  const [result] = await db.insert(highlights).values(values).returning({ id: highlights.id });
  return { id: result.id };
}

export async function deleteHighlight(id: number) {
  const db = await requireDb();
  const [existing] = await db.select().from(highlights).where(eq(highlights.id, id)).limit(1);
  await db.delete(highlights).where(eq(highlights.id, id));
  await cleanUpMediaKeys([existing?.imageKey]);
}

export async function saveBrandStory(input: { quote: string; attribution?: string | null; heading: string; body: string; imageKey?: string | null; imageUrl: string; altText?: string | null }) {
  const db = await requireDb();
  const [existing] = await db.select().from(brandStories).limit(1);
  const values = { ...input, attribution: input.attribution ?? null, imageKey: input.imageKey ?? null, altText: input.altText ?? null };
  if (existing) {
    await db.update(brandStories).set(values).where(eq(brandStories.id, existing.id));
    if (existing.imageKey !== values.imageKey) await cleanUpMediaKeys([existing.imageKey]);
    return { id: existing.id };
  }
  const [result] = await db.insert(brandStories).values(values).returning({ id: brandStories.id });
  return { id: result.id };
}

export async function saveMessengerUrl(messengerUrl: string) {
  const db = await requireDb();
  const [existing] = await db.select().from(storeSettings).limit(1);
  if (existing) {
    await db.update(storeSettings).set({ messengerUrl }).where(eq(storeSettings.id, existing.id));
    return;
  }
  await db.insert(storeSettings).values({ messengerUrl });
}
