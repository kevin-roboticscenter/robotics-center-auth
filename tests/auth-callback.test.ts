import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import { GET } from "@/app/auth/callback/route";

beforeEach(() => {
  mocks.createServerSupabaseClient.mockReset();
});

describe("auth callback", () => {
  test("exchanges a code, keeps a safe return path, and propagates auth headers", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    mocks.createServerSupabaseClient.mockImplementation(
      async (responseHeaders: Headers) => {
        responseHeaders.set("Cache-Control", "private, no-store");
        responseHeaders.set("Pragma", "no-cache");
        return { auth: { exchangeCodeForSession } };
      },
    );

    const response = await GET(
      new Request(
        "https://login-preview.example/auth/callback?code=pkce-code&next=%2Foauth%2Fconsent%3Fauthorization_id%3Dabc",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("pkce-code");
    expect(response.headers.get("location")).toBe(
      "https://login-preview.example/oauth/consent?authorization_id=abc",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.headers.get("set-cookie")).toContain("rc_portal_return=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  test("reads a safe return cookie when next is absent", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) },
    });
    const response = await GET(
      new Request("https://login-preview.example/auth/callback?code=pkce-code", {
        headers: {
          cookie:
            "rc_portal_return=%2Foauth%2Fconsent%3Fauthorization_id%3Dcookie-id",
        },
      }),
    );
    expect(response.headers.get("location")).toBe(
      "https://login-preview.example/oauth/consent?authorization_id=cookie-id",
    );
  });

  test("rejects an unsafe next path", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) },
    });
    const response = await GET(
      new Request(
        "https://login-preview.example/auth/callback?code=pkce-code&next=https%3A%2F%2Fevil.example%2Fsteal",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://login-preview.example/launcher",
    );
  });

  test("returns a generic error and keeps no-store headers after exchange failure", async () => {
    mocks.createServerSupabaseClient.mockImplementation(
      async (responseHeaders: Headers) => {
        responseHeaders.set("Cache-Control", "private, no-store");
        return {
          auth: {
            exchangeCodeForSession: vi
              .fn()
              .mockResolvedValue({ error: new Error("provider detail") }),
          },
        };
      },
    );
    const response = await GET(
      new Request("https://login-preview.example/auth/callback?code=bad-code"),
    );
    expect(response.headers.get("location")).toBe(
      "https://login-preview.example/error?reason=callback",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("location")).not.toContain("provider");
  });

  test("does not call Supabase when the callback code is missing", async () => {
    const response = await GET(
      new Request("https://login-preview.example/auth/callback"),
    );
    expect(response.headers.get("location")).toBe(
      "https://login-preview.example/error?reason=callback",
    );
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });
});
