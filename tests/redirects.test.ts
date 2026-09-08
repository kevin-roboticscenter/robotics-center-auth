import { afterEach, describe, expect, test, vi } from "vitest";
import {
  allowedReturnOrigins,
  isAllowedOAuthRedirectUrl,
  isAllowedOAuthRequest,
  safeExternalReturnUrl,
  safePortalPath,
} from "@/lib/auth/redirects";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("portal return paths", () => {
  test("keeps safe local paths", () => {
    expect(safePortalPath("/oauth/consent?authorization_id=abc")).toBe(
      "/oauth/consent?authorization_id=abc",
    );
  });

  test.each([
    "https://evil.example/steal",
    "//evil.example/steal",
    "/\\evil.example/steal",
    "/path\u0000suffix",
    "not-a-path",
  ])("rejects unsafe local path %s", (value) => {
    expect(safePortalPath(value)).toBe("/launcher");
  });
});

describe("external return allowlist", () => {
  test("contains only defaults plus normalized configured origins", () => {
    vi.stubEnv(
      "AUTH_ALLOWED_RETURN_ORIGINS",
      "https://preview.roboticscenter.ai/path,https://user:pass@evil.example,http://evil.example",
    );
    expect([...allowedReturnOrigins()]).toEqual([
      "https://roboticscenter.ai",
      "https://www.roboticscenter.ai",
      "https://preview.roboticscenter.ai",
    ]);
  });

  test("keeps an allowed URL and rejects external or credentialed URLs", () => {
    vi.stubEnv(
      "AUTH_ALLOWED_RETURN_ORIGINS",
      "https://preview.roboticscenter.ai",
    );
    const fallback = "https://login-preview.example/";
    expect(
      safeExternalReturnUrl(
        "https://preview.roboticscenter.ai/account?from=login",
        fallback,
      ).toString(),
    ).toBe("https://preview.roboticscenter.ai/account?from=login");
    expect(
      safeExternalReturnUrl("https://evil.example/steal", fallback).toString(),
    ).toBe(fallback);
    expect(
      safeExternalReturnUrl(
        "https://user:pass@preview.roboticscenter.ai/account",
        fallback,
      ).toString(),
    ).toBe(fallback);
    expect(
      safeExternalReturnUrl(
        "blob:https://preview.roboticscenter.ai/attacker-value",
        fallback,
      ).toString(),
    ).toBe(fallback);
  });
});

describe("OAuth consent allowlists", () => {
  test("requires an exact client id and exact callback URI", () => {
    vi.stubEnv("AUTH_ALLOWED_OAUTH_CLIENT_IDS", "website-preview");
    vi.stubEnv(
      "AUTH_ALLOWED_OAUTH_REDIRECT_URIS",
      "https://preview.roboticscenter.ai/auth/sso/callback",
    );

    expect(
      isAllowedOAuthRequest({
        clientId: "website-preview",
        redirectUri: "https://preview.roboticscenter.ai/auth/sso/callback",
      }),
    ).toBe(true);
    expect(
      isAllowedOAuthRequest({
        clientId: "website-production",
        redirectUri: "https://preview.roboticscenter.ai/auth/sso/callback",
      }),
    ).toBe(false);
    expect(
      isAllowedOAuthRequest({
        clientId: "website-preview",
        redirectUri: "https://preview.roboticscenter.ai/auth/sso/callback/extra",
      }),
    ).toBe(false);
  });

  test("allows callback query parameters but rejects credentials and path changes", () => {
    vi.stubEnv(
      "AUTH_ALLOWED_OAUTH_REDIRECT_URIS",
      "https://preview.roboticscenter.ai/auth/sso/callback",
    );
    expect(
      isAllowedOAuthRedirectUrl(
        "https://preview.roboticscenter.ai/auth/sso/callback?code=abc&state=123",
      ),
    ).toBe(true);
    expect(
      isAllowedOAuthRedirectUrl(
        "https://user:pass@preview.roboticscenter.ai/auth/sso/callback?code=abc",
      ),
    ).toBe(false);
    expect(
      isAllowedOAuthRedirectUrl(
        "https://preview.roboticscenter.ai/auth/sso/callback/extra?code=abc",
      ),
    ).toBe(false);
  });
});
