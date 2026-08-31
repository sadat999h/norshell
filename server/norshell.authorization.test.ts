import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { filterCollectionProducts, filterProductsByCategory, getProductPurchaseUrl } from "../shared/storefront";

function contextFor(role: "admin" | "user" | null): TrpcContext {
  return {
    user: role ? {
      id: 99,
      openId: `test-${role}`,
      email: "test@norshell.example",
      name: "Norshell Test",
      loginMethod: "supabase",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Norshell authorization and purchase flow", () => {
  // NOTE: login is disabled for now, so admin.* procedures are intentionally
  // open (publicProcedure) — see server/routers.ts. These tests just confirm
  // that an unauthenticated caller can still reach catalog management.
  // Restore the FORBIDDEN-for-non-admin assertions once adminProcedure is
  // reinstated alongside Supabase auth.
  it("allows catalog management for a non-admin user while login is disabled", async () => {
    const caller = appRouter.createCaller(contextFor("user"));
    await expect(caller.admin.getData()).resolves.toBeTruthy();
  });

  it("allows catalog management for an unauthenticated visitor while login is disabled", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.admin.getData()).resolves.toBeTruthy();
  });

  it("requires a secure HTTPS Messenger URL before saving settings", async () => {
    const caller = appRouter.createCaller(contextFor("admin"));
    await expect(caller.admin.settings.saveMessengerUrl({ messengerUrl: "http://m.me/norshell" })).rejects.toBeTruthy();
  });

  it("exposes the global Messenger link only for available products", () => {
    expect(getProductPurchaseUrl("available", "https://m.me/norshell")).toBe("https://m.me/norshell");
    expect(getProductPurchaseUrl("upcoming", "https://m.me/norshell")).toBeNull();
  });

  it("returns database-backed available and upcoming products through the public storefront router", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    const storefront = await caller.storefront.get();

    expect(storefront.products.some(product => product.status === "available")).toBe(true);
    expect(storefront.products.some(product => product.status === "upcoming")).toBe(true);
    expect(storefront.products.filter(product => product.status === "upcoming").every(product => getProductPurchaseUrl(product.status, storefront.settings?.messengerUrl) === null)).toBe(true);
  });

  it("filters collection items by the selected category without changing the all-pieces view", () => {
    const products = [{ id: 1, categoryId: 4 }, { id: 2, categoryId: 7 }, { id: 3, categoryId: 4 }];
    expect(filterProductsByCategory(products, "all")).toHaveLength(3);
    expect(filterProductsByCategory(products, 4).map(product => product.id)).toEqual([1, 3]);
  });

  it("shows only upcoming products when the Upcoming collection filter is selected", () => {
    const products = [
      { id: 1, categoryId: 4, status: "available" as const },
      { id: 2, categoryId: 7, status: "upcoming" as const },
      { id: 3, categoryId: 4, status: "upcoming" as const },
    ];
    expect(filterCollectionProducts(products, "upcoming").map(product => product.id)).toEqual([2, 3]);
    expect(filterCollectionProducts(products, "all").map(product => product.id)).toEqual([1]);
  });
});
