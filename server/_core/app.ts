import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";

// Builds the Express app (routes/middleware only — no listen()).
// Shared by the local dev/start server (server/_core/index.ts) and the
// Vercel serverless entry point (api/index.ts) so both stay in sync.
export function createApp() {
  const app = express();
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      // Cache the public storefront read at Vercel's edge for 30s (serving
      // stale for up to 5min while it revalidates in the background). This
      // means most visitors get an instant cached response instead of a
      // fresh DB round-trip + cold start on every load. Admin routes are
      // untouched — they're never matched here since they use different
      // procedure paths.
      responseMeta({ type, paths, errors }) {
        const isPublicStorefrontRead =
          type === "query" &&
          errors.length === 0 &&
          (paths ?? []).every(path => path === "storefront.get");
        if (isPublicStorefrontRead) {
          return {
            headers: {
              "cache-control": "public, s-maxage=30, stale-while-revalidate=300",
            },
          };
        }
        return {};
      },
    })
  );
  return app;
}
