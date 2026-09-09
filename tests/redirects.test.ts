import { afterEach, describe, expect, test, vi } from "vitest";
import {
  allowedReturnOrigins,
  isAllowedOAuthRedirectUrl,
  isAllowedOAuthRequest,
  safeExternalReturnUrl,
  safePortalPath,
} from "@/lib/auth/redirects";
import { allowedOAuthClients } from "@/lib/auth/oauth-allowlist";

const websiteCallback =
  "https://preview.roboticscenter.ai/auth/sso/callback";
const centerOsCallback = "centeros://auth/callback";

function stubMappedOAuthClient() {
  vi.stubEnv(
    "AUTH_ALLOWED_OAUTH_CLIENTS",
    JSON.stringify({ "website-preview": [websiteCallback] }),
  );
}

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
    stubMappedOAuthClient();

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
    stubMappedOAuthClient();
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

  test("allows only the exact CenterOS desktop callback for an explicitly mapped client", () => {
    vi.stubEnv(
      "AUTH_ALLOWED_OAUTH_CLIENTS",
      JSON.stringify({ "centeros-desktop": [centerOsCallback] }),
    );

    expect(
      isAllowedOAuthRequest({
        clientId: "centeros-desktop",
        redirectUri: centerOsCallback,
      }),
    ).toBe(true);
    expect(
      isAllowedOAuthRedirectUrl(
        `${centerOsCallback}?code=abc&state=123`,
        centerOsCallback,
      ),
    ).toBe(true);

    for (const redirectUri of [
      "centeros://evil/callback",
      "centeros://auth/callback/extra",
      "other-app://auth/callback",
    ]) {
      expect(
        isAllowedOAuthRequest({ clientId: "centeros-desktop", redirectUri }),
      ).toBe(false);
      expect(
        isAllowedOAuthRedirectUrl(`${redirectUri}?code=abc&state=123`),
      ).toBe(false);
    }
  });

  test("binds every configured client to only its own callbacks", () => {
    vi.stubEnv(
      "AUTH_ALLOWED_OAUTH_CLIENTS",
      JSON.stringify({
        "website-preview": [
          "https://website-preview.example/auth/sso/callback",
        ],
        "centeros-preview": [
          "https://centeros-preview.example/auth/sso/callback",
        ],
      }),
    );

    expect(
      isAllowedOAuthRequest({
        clientId: "website-preview",
        redirectUri: "https://website-preview.example/auth/sso/callback",
      }),
    ).toBe(true);
    expect(
      isAllowedOAuthRequest({
        clientId: "centeros-preview",
        redirectUri: "https://centeros-preview.example/auth/sso/callback",
      }),
    ).toBe(true);
    expect(
      isAllowedOAuthRequest({
        clientId: "website-preview",
        redirectUri: "https://centeros-preview.example/auth/sso/callback",
      }),
    ).toBe(false);
    expect(
      isAllowedOAuthRequest({
        clientId: "centeros-preview",
        redirectUri: "https://website-preview.example/auth/sso/callback",
      }),
    ).toBe(false);
  });

  test("fails closed for malformed mapped config without legacy fallback", () => {
    vi.stubEnv("AUTH_ALLOWED_OAUTH_CLIENTS", "not-json");
    vi.stubEnv("AUTH_ALLOWED_OAUTH_CLIENT_IDS", "website-preview");
    vi.stubEnv(
      "AUTH_ALLOWED_OAUTH_REDIRECT_URIS",
      "https://website-preview.example/auth/sso/callback",
    );

    expect(
      isAllowedOAuthRequest({
        clientId: "website-preview",
        redirectUri: "https://website-preview.example/auth/sso/callback",
      }),
    ).toBe(false);
  });

  test("legacy lists remain compatible only for one exact pair", () => {
    expect(
      allowedOAuthClients({
        AUTH_ALLOWED_OAUTH_CLIENT_IDS: "website-preview",
        AUTH_ALLOWED_OAUTH_REDIRECT_URIS:
          "https://website-preview.example/auth/sso/callback",
      }).get("website-preview"),
    ).toEqual(
      new Set(["https://website-preview.example/auth/sso/callback"]),
    );
    expect(
      allowedOAuthClients({
        AUTH_ALLOWED_OAUTH_CLIENT_IDS:
          "website-preview,centeros-preview",
        AUTH_ALLOWED_OAUTH_REDIRECT_URIS:
          "https://website-preview.example/auth/sso/callback,https://centeros-preview.example/auth/sso/callback",
      }).size,
    ).toBe(0);
  });

  test.each([
    "https://preview.roboticscenter.ai:443/auth/sso/callback",
    "https://PREVIEW.roboticscenter.ai/auth/sso/callback",
    "https://preview.roboticscenter.ai/auth/./sso/callback",
    "https://preview.roboticscenter.ai/auth/sso/call\nback",
  ])("rejects a callback that URL parsing would rewrite: %s", (redirectUri) => {
    stubMappedOAuthClient();
    expect(
      isAllowedOAuthRequest({ clientId: "website-preview", redirectUri }),
    ).toBe(false);
  });

  test("rejects a map that assigns the same callback to two clients", () => {
    vi.stubEnv(
      "AUTH_ALLOWED_OAUTH_CLIENTS",
      JSON.stringify({
        "website-preview": [websiteCallback],
        "centeros-preview": [websiteCallback],
      }),
    );
    expect(
      isAllowedOAuthRequest({
        clientId: "website-preview",
        redirectUri: websiteCallback,
      }),
    ).toBe(false);
  });
});
