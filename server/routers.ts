import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { uploadNorshellMedia } from "./supabase";

const slugSchema = z.string().trim().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.");
const mediaSchema = z.object({ storageKey: z.string().max(520).nullable().optional(), url: z.string().url(), altText: z.string().max(240).nullable().optional() });
const productSchema = z.object({
  name: z.string().trim().min(2).max(180), slug: slugSchema, categoryId: z.number().int().positive().nullable().optional(),
  status: z.enum(["available", "upcoming"]), price: z.number().int().nonnegative().nullable().optional(), material: z.string().max(180).nullable().optional(),
  shortDescription: z.string().max(320).nullable().optional(), description: z.string().max(8000).nullable().optional(), care: z.string().max(2000).nullable().optional(),
  isFeatured: z.boolean().optional(), displayOrder: z.number().int().min(0).max(9999).optional(), images: z.array(mediaSchema).max(8),
});
const categorySchema = z.object({ name: z.string().trim().min(2).max(120), slug: slugSchema, description: z.string().max(1000).nullable().optional(), displayOrder: z.number().int().min(0).max(9999).optional() });

function parseImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Please select a JPG, PNG, or WebP image." });
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength > 10 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Images must be 10MB or smaller." });
  return { contentType: match[1] as "image/jpeg" | "image/png" | "image/webp", bytes };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    // Identity comes from the Supabase access token sent as a Bearer header
    // (see server/_core/context.ts). Logging out is a client-side call to
    // supabase.auth.signOut() — there's no server-side session to clear.
    me: publicProcedure.query(opts => opts.ctx.user),
  }),
  storefront: router({
    get: publicProcedure.query(() => db.getStorefrontData()),
  }),
  // NOTE: login is disabled for now, so every admin.* procedure below is a
  // publicProcedure — anyone who can reach /api/trpc can call these. Swap
  // these back to adminProcedure (see ./_core/trpc.ts) once Supabase auth
  // is reconnected.
  admin: router({
    getData: publicProcedure.query(() => db.getStorefrontData()),
    categories: router({
      create: publicProcedure.input(categorySchema).mutation(({ input }) => db.createCategory(input)),
      update: publicProcedure.input(z.object({ id: z.number().int().positive(), data: categorySchema })).mutation(({ input }) => db.updateCategory(input.id, input.data)),
      delete: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteCategory(input.id)),
    }),
    products: router({
      create: publicProcedure.input(productSchema).mutation(({ input }) => db.createProduct(input)),
      update: publicProcedure.input(z.object({ id: z.number().int().positive(), data: productSchema })).mutation(({ input }) => db.updateProduct(input.id, input.data)),
      delete: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteProduct(input.id)),
    }),
    highlights: router({
      save: publicProcedure.input(z.object({ id: z.number().int().positive().optional(), eyebrow: z.string().max(120).nullable().optional(), heading: z.string().min(2).max(220), body: z.string().max(3000).nullable().optional(), imageKey: z.string().max(520).nullable().optional(), imageUrl: z.string().url(), altText: z.string().max(240).nullable().optional(), displayOrder: z.number().int().min(0).max(9999).optional() })).mutation(({ input }) => db.saveHighlight(input)),
      delete: publicProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.deleteHighlight(input.id)),
    }),
    brandStory: router({
      save: publicProcedure.input(z.object({ quote: z.string().min(2).max(2000), attribution: z.string().max(160).nullable().optional(), heading: z.string().min(2).max(220), body: z.string().min(2).max(8000), imageKey: z.string().max(520).nullable().optional(), imageUrl: z.string().url(), altText: z.string().max(240).nullable().optional() })).mutation(({ input }) => db.saveBrandStory(input)),
    }),
    settings: router({
      saveMessengerUrl: publicProcedure.input(z.object({ messengerUrl: z.string().url().refine(url => /^https:\/\//.test(url), "Use a secure https URL.") })).mutation(({ input }) => db.saveMessengerUrl(input.messengerUrl)),
    }),
    media: router({
      upload: publicProcedure.input(z.object({ dataUrl: z.string().max(14_000_000), fileName: z.string().max(180), folder: z.enum(["products", "highlights", "story"]) })).mutation(async ({ input }) => {
        const { bytes, contentType } = parseImageDataUrl(input.dataUrl);
        return uploadNorshellMedia(bytes, input.fileName, contentType, input.folder);
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
