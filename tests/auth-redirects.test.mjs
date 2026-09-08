import assert from "node:assert/strict";
import test from "node:test";
import {
  allowedReturnOrigins,
  isAllowedOAuthRedirectUrl,
  safeExternalReturnUrl,
  safePortalPath,
  safeRecoveryReturnTarget,
} from "../lib/auth/redirects.ts";

const ENV_NAMES = [
  "AUTH_ALLOWED_OAUTH_REDIRECT_URIS",
  "AUTH_ALLOWED_RETURN_ORIGINS",
];

function withAuthEnvironment(run) {
  const previous = Object.fromEntries(
    ENV_NAMES.map((name) => [name, process.env[name]]),
  );

  process.env.AUTH_ALLOWED_OAUTH_REDIRECT_URIS =
    "https://website-preview.example/auth/sso/callback";
  process.env.AUTH_ALLOWED_RETURN_ORIGINS =
    "https://website-preview.example,http://localhost:3000,ftp://localhost";

  try {
    run();
  } finally {
    for (const name of ENV_NAMES) {
      const value = previous[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("OAuth redirect allowlist accepts only the exact trusted callback base", () => {
  withAuthEnvironment(() => {
    assert.equal(
      isAllowedOAuthRedirectUrl(
        "https://website-preview.example/auth/sso/callback?code=code&state=state",
      ),
      true,
    );
    assert.equal(
      isAllowedOAuthRedirectUrl(
        "https://other.example/auth/sso/callback?code=code",
      ),
      false,
    );
    assert.equal(
      isAllowedOAuthRedirectUrl(
        "https://website-preview.example/auth/sso/other?code=code",
      ),
      false,
    );
    assert.equal(
      isAllowedOAuthRedirectUrl(
        "https://user:password@website-preview.example/auth/sso/callback?code=code",
      ),
      false,
    );
    process.env.AUTH_ALLOWED_OAUTH_REDIRECT_URIS =
      "ftp://localhost/auth/sso/callback,http://localhost:3000/auth/sso/callback";
    assert.equal(
      isAllowedOAuthRedirectUrl(
        "ftp://localhost/auth/sso/callback?code=code",
      ),
      false,
    );
    assert.equal(
      isAllowedOAuthRedirectUrl(
        "http://localhost:3000/auth/sso/callback?code=code",
      ),
      true,
    );
  });
});

test("return origins allow HTTPS and local HTTP but reject other schemes", () => {
  withAuthEnvironment(() => {
    const origins = allowedReturnOrigins();
    assert.equal(origins.has("https://website-preview.example"), true);
    assert.equal(origins.has("http://localhost:3000"), true);
    assert.equal(origins.has("ftp://localhost"), false);
  });
});

test("external returns stay on an allowlisted origin", () => {
  withAuthEnvironment(() => {
    const fallback = "https://portal-preview.example/launcher";
    assert.equal(
      safeExternalReturnUrl(
        "https://website-preview.example/account?tab=orders",
        fallback,
      ).href,
      "https://website-preview.example/account?tab=orders",
    );
    assert.equal(
      safeExternalReturnUrl("https://evil.example/steal", fallback).href,
      fallback,
    );
    assert.equal(
      safeExternalReturnUrl(
        "https://user@website-preview.example/account",
        fallback,
      ).href,
      fallback,
    );
    assert.equal(
      safeExternalReturnUrl(
        "blob:https://website-preview.example/attacker-value",
        fallback,
      ).href,
      fallback,
    );
  });
});

test("password recovery accepts portal paths and allowlisted absolute URLs", () => {
  withAuthEnvironment(() => {
    assert.equal(
      safeRecoveryReturnTarget("/launcher?from=recovery"),
      "/launcher?from=recovery",
    );
    assert.equal(
      safeRecoveryReturnTarget(
        "https://website-preview.example/account?password=updated#security",
      ),
      "https://website-preview.example/account?password=updated#security",
    );
    assert.equal(
      safeRecoveryReturnTarget("https://www.roboticscenter.ai/account"),
      "https://www.roboticscenter.ai/account",
    );
    assert.equal(
      safeRecoveryReturnTarget("http://localhost:3000/account"),
      "http://localhost:3000/account",
    );
  });
});

test("password recovery rejects unsafe or unlisted destinations", () => {
  withAuthEnvironment(() => {
    const fallback = "/launcher";
    const rejected = [
      "//website-preview.example/account",
      "https:\\website-preview.example\\account",
      "https://website-preview.example/account\nheader",
      "https://evil.example/account",
      "https://user@website-preview.example/account",
      "https://user:password@website-preview.example/account",
      "http://website-preview.example/account",
      "ftp://localhost/account",
      "https://website-preview.example:444/account",
      "website-preview.example/account",
    ];

    for (const value of rejected) {
      assert.equal(safeRecoveryReturnTarget(value), fallback, value);
    }
    assert.equal(
      safeRecoveryReturnTarget([
        "https://website-preview.example/account",
        "https://evil.example/account",
      ]),
      fallback,
    );
  });
});

test("recovery callback return remains an internal update-password path", () => {
  withAuthEnvironment(() => {
    const websiteReturn = "https://website-preview.example/account";
    const callbackReturn = `/update-password?return_to=${encodeURIComponent(
      websiteReturn,
    )}`;

    assert.equal(safePortalPath(callbackReturn), callbackReturn);
    const recoveredReturn = new URL(
      callbackReturn,
      "https://portal-preview.example",
    ).searchParams.get("return_to");
    assert.equal(
      safeRecoveryReturnTarget(recoveredReturn),
      websiteReturn,
    );
  });
});

test("main login and OAuth return values remain portal-path-only", () => {
  assert.equal(
    safePortalPath("https://website-preview.example/account"),
    "/launcher",
  );
  assert.equal(
    safePortalPath("/oauth/consent?authorization_id=trusted"),
    "/oauth/consent?authorization_id=trusted",
  );
  assert.equal(
    safePortalPath([
      "/oauth/consent?authorization_id=trusted",
      "https://evil.example",
    ]),
    "/launcher",
  );
});
