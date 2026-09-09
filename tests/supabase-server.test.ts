import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

import { createServerSupabaseClient } from "@/lib/supabase/server";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://staging.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "staging-anon-key");
});

describe("server Supabase response propagation", () => {
  test("copies auth cache headers and preserves cookie security attributes", async () => {
    const cookieStore = {
      getAll: vi.fn().mockReturnValue([{ name: "existing", value: "cookie" }]),
      set: vi.fn(),
    };
    const client = { auth: {} };
    mocks.cookies.mockResolvedValue(cookieStore);
    mocks.createServerClient.mockReturnValue(client);
    const responseHeaders = new Headers();

    await expect(createServerSupabaseClient(responseHeaders)).resolves.toBe(client);

    const options = mocks.createServerClient.mock.calls[0]?.[2] as {
      cookies: {
        getAll: () => Array<{ name: string; value: string }>;
        setAll: (
          cookies: Array<{
            name: string;
            value: string;
            options: Record<string, unknown>;
          }>,
          headers: Record<string, string>,
        ) => void;
      };
    };

    expect(options.cookies.getAll()).toEqual([
      { name: "existing", value: "cookie" },
    ]);
    options.cookies.setAll(
      [
        {
          name: "sb-session",
          value: "token",
          options: {
            httpOnly: true,
            sameSite: "strict",
            secure: true,
          },
        },
      ],
      {
        "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
        Expires: "0",
        Pragma: "no-cache",
      },
    );

    expect(responseHeaders.get("cache-control")).toContain("private");
    expect(responseHeaders.get("cache-control")).toContain("no-store");
    expect(responseHeaders.get("expires")).toBe("0");
    expect(responseHeaders.get("pragma")).toBe("no-cache");
    expect(cookieStore.set).toHaveBeenCalledWith("sb-session", "token", {
      path: "/",
      sameSite: "strict",
      secure: true,
      httpOnly: true,
    });
  });
});
