import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import * as logoutRoute from "@/app/api/logout/route";
import LogoutPage from "@/app/logout/page";

function postRequest(options?: { origin?: string; returnTo?: string }) {
  const headers = new Headers({
    "content-type": "application/x-www-form-urlencoded",
  });
  if (options?.origin !== undefined) {
    headers.set("origin", options.origin);
  }
  const body = new URLSearchParams();
  if (options?.returnTo) body.set("return_to", options.returnTo);
  return new Request("https://login-preview.example/api/logout", {
    method: "POST",
    headers,
    body,
  });
}

function findElement(node: ReactNode, type: string): ReactElement | null {
  if (!isValidElement(node)) return null;
  if (node.type === type) return node;
  const props = node.props as { children?: ReactNode };
  for (const child of Children.toArray(props.children)) {
    const match = findElement(child, type);
    if (match) return match;
  }
  return null;
}

beforeEach(() => {
  vi.stubEnv(
    "AUTH_ALLOWED_RETURN_ORIGINS",
    "https://website-preview.example",
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("logout", () => {
  test("GET /logout renders confirmation and cannot revoke a session", async () => {
    const page = await LogoutPage({
      searchParams: Promise.resolve({
        return_to: "https://website-preview.example/account",
      }),
    });
    const form = findElement(page, "form");
    expect(form?.props).toMatchObject({
      action: "/api/logout",
      method: "post",
    });
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
    expect(logoutRoute).not.toHaveProperty("GET");
  });

  test.each([undefined, "https://evil.example"])(
    "POST rejects missing or cross-origin Origin %s before Supabase",
    async (origin) => {
      const response = await logoutRoute.POST(postRequest({ origin }));
      expect(response.status).toBe(403);
      expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
    },
  );

  test("POST globally revokes and redirects to an allowed destination", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    mocks.createServerSupabaseClient.mockImplementation(
      async (responseHeaders: Headers) => {
        responseHeaders.set("Cache-Control", "private, no-store");
        return { auth: { signOut } };
      },
    );

    const response = await logoutRoute.POST(
      postRequest({
        origin: "https://login-preview.example",
        returnTo: "https://website-preview.example/account?signed_out=1",
      }),
    );

    expect(signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://website-preview.example/account?signed_out=1",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  test("POST rejects an external return destination", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    });
    const response = await logoutRoute.POST(
      postRequest({
        origin: "https://login-preview.example",
        returnTo: "https://evil.example/steal",
      }),
    );
    expect(response.headers.get("location")).toBe(
      "https://login-preview.example/",
    );
  });

  test("does not claim success if global revocation fails", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { signOut: vi.fn().mockResolvedValue({ error: new Error("down") }) },
    });
    const response = await logoutRoute.POST(
      postRequest({ origin: "https://login-preview.example" }),
    );
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "Sign out failed" });
  });
});
