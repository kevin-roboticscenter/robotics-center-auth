import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("portal auth cookie defaults", () => {
  test("uses Secure and SameSite=Lax in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { portalCookieOptions } = await import("@/lib/supabase/config");
    expect(portalCookieOptions).toEqual({
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  test("permits local HTTP cookies only outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const { portalCookieOptions } = await import("@/lib/supabase/config");
    expect(portalCookieOptions.secure).toBe(false);
  });
});
