import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const productStatusEnum = pgEnum("product_status", ["available", "upcoming"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Supabase Auth user id (uuid). Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
  displayOrder: integer("displayOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  categoryId: integer("categoryId").references(() => categories.id, { onDelete: "set null" }),
  status: productStatusEnum("status").notNull().default("available"),
  price: integer("price"),
  material: varchar("material", { length: 180 }),
  shortDescription: varchar("shortDescription", { length: 320 }),
  description: text("description"),
  care: text("care"),
  isFeatured: boolean("isFeatured").notNull().default(false),
  displayOrder: integer("displayOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const productImages = pgTable("productImages", {
  id: serial("id").primaryKey(),
  productId: integer("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  storageKey: varchar("storageKey", { length: 520 }),
  url: text("url").notNull(),
  altText: varchar("altText", { length: 240 }),
  displayOrder: integer("displayOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const highlights = pgTable("highlights", {
  id: serial("id").primaryKey(),
  eyebrow: varchar("eyebrow", { length: 120 }),
  heading: varchar("heading", { length: 220 }).notNull(),
  body: text("body"),
  imageKey: varchar("imageKey", { length: 520 }),
  imageUrl: text("imageUrl").notNull(),
  altText: varchar("altText", { length: 240 }),
  displayOrder: integer("displayOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const brandStories = pgTable("brandStories", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull(),
  attribution: varchar("attribution", { length: 160 }),
  heading: varchar("heading", { length: 220 }).notNull(),
  body: text("body").notNull(),
  imageKey: varchar("imageKey", { length: 520 }),
  imageUrl: text("imageUrl").notNull(),
  altText: varchar("altText", { length: 240 }),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const storeSettings = pgTable("storeSettings", {
  id: serial("id").primaryKey(),
  messengerUrl: varchar("messengerUrl", { length: 1024 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
