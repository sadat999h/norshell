import { describe, expect, it } from "vitest";

describe("Supabase Storage credentials", () => {
  it("authorizes a lightweight bucket-list request", async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(url, "SUPABASE_URL must be configured").toBeTruthy();
    expect(key, "SUPABASE_SERVICE_ROLE_KEY must be configured").toBeTruthy();

    const response = await fetch(`${url!.replace(/\/$/, "")}/storage/v1/bucket`, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
      },
    });

    expect(response.status, "Supabase Storage must accept the configured server-side key").toBeGreaterThanOrEqual(200);
    expect(response.status, "Supabase Storage must accept the configured server-side key").toBeLessThan(300);
  }, 20_000);
});
