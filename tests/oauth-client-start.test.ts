import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  oauthClientReadyUrl,
  oauthClientStartPath,
  parseOAuthClientStart,
} from "@/lib/auth/oauth-client-start";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import { GET } from "@/app/oauth/client-start/route";

const callback = "https://website-preview.example/auth/sso/callback";
const validQuery = new URLSearchParams({
  intent: "signup",
  client_id: "website-preview",
  redirect_uri: callback,
  next: "/checkout?step=payment",
});

function request(query = validQuery) {
  return new Request(
    `https://login-preview.example/oauth/client-start?${query.toString()}`,
  );
}

function authClient(signedIn: boolean) {
  return {
    auth: {
      getClaims: vi.fn().mockResolvedValue({
        data: signedIn ? { claims: { sub: "test-user" } } : null,
        error: null,
      }),
    },
  };
}

beforeEach(() => {
  mocks.createServerSupabaseClient.mockReset();
  vi.stubEnv(
    "AUTH_ALLOWED_OAUTH_CLIENTS",
    JSON.stringify({ "website-preview": [callback] }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("OAuth client start helpers", () => {
  test("parses the exact signup contract and builds canonical destinations", () => {
    const start = parseOAuthClientStart(validQuery);
    expect(start).toEqual({
      intent: "signup",
      clientId: "website-preview",
      redirectUri: callback,
      next: "/checkout?step=payment",
    });
    expect(oauthClientStartPath(start!)).toBe(
      "/oauth/client-start?intent=signup&client_id=website-preview&redirect_uri=https%3A%2F%2Fwebsite-preview.example%2Fauth%2Fsso%2Fcallback&next=%2Fcheckout%3Fstep%3Dpayment",
    );
    expect(oauthClientReadyUrl(start!).toString()).toBe(
      "https://website-preview.example/auth/sso/start?next=%2Fcheckout%3Fstep%3Dpayment&intent=signup&portal_ready=1",
    );
  });

  test.each([
    ["missing intent", "client_id=website-preview&redirect_uri=" + encodeURIComponent(callback) + "&next=%2Faccount"],
    ["wrong intent", "intent=login&client_id=website-preview&redirect_uri=" + encodeURIComponent(callback) + "&next=%2Faccount"],
    ["external next", "intent=signup&client_id=website-preview&redirect_uri=" + encodeURIComponent(callback) + "&next=https%3A%2F%2Fevil.example"],
    ["unknown parameter", validQuery.toString() + "&authorize_url=https%3A%2F%2Fevil.example"],
    ["duplicate client", validQuery.toString() + "&client_id=other"],
  ])("rejects %s", (_name, query) => {
    expect(parseOAuthClientStart(new URLSearchParams(query))).toBeNull();
  });

  test("rejects an allowlisted non-web callback scheme", () => {
    const blobCallback = "blob:https://website-preview.example/callback";
    vi.stubEnv(
      "AUTH_ALLOWED_OAUTH_CLIENTS",
      JSON.stringify({ "website-preview": [blobCallback] }),
    );
    const query = new URLSearchParams({
      intent: "signup",
      client_id: "website-preview",
      redirect_uri: blobCallback,
      next: "/account",
    });
    expect(parseOAuthClientStart(query)).toBeNull();
  });
});

describe("OAuth client start route", () => {
  test("rejects invalid input before calling Supabase", async () => {
    const query = new URLSearchParams(validQuery);
    query.set("redirect_uri", "https://evil.example/auth/sso/callback");

    const response = await GET(request(query));

    expect(response.headers.get("location")).toBe(
      "https://login-preview.example/error?reason=invalid_oauth_start",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  test("sends a signed-out user to signup with a canonical local return", async () => {
    mocks.createServerSupabaseClient.mockImplementation(
      async (responseHeaders: Headers) => {
        responseHeaders.set("Cache-Control", "private, no-store, max-age=0");
        responseHeaders.set("X-Auth-Refresh", "propagated");
        return authClient(false);
      },
    );

    const response = await GET(request());
    const destination = new URL(response.headers.get("location")!);

    expect(destination.origin).toBe("https://login-preview.example");
    expect(destination.pathname).toBe("/");
    expect(destination.searchParams.get("mode")).toBe("signup");
    expect(destination.searchParams.get("return_to")).toBe(
      "/oauth/client-start?intent=signup&client_id=website-preview&redirect_uri=https%3A%2F%2Fwebsite-preview.example%2Fauth%2Fsso%2Fcallback&next=%2Fcheckout%3Fstep%3Dpayment",
    );
    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0",
    );
    expect(response.headers.get("x-auth-refresh")).toBe("propagated");
  });

  test("returns a signed-in user only to the validated Website start route", async () => {
    mocks.createServerSupabaseClient.mockImplementation(
      async (responseHeaders: Headers) => {
        responseHeaders.set("Set-Cookie", "sb-refresh=updated; Path=/; HttpOnly");
        return authClient(true);
      },
    );

    const response = await GET(request());

    expect(response.headers.get("location")).toBe(
      "https://website-preview.example/auth/sso/start?next=%2Fcheckout%3Fstep%3Dpayment&intent=signup&portal_ready=1",
    );
    expect(response.headers.get("set-cookie")).toContain("sb-refresh=updated");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
