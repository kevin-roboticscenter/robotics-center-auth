const DEFAULT_RETURN_ORIGINS = [
  "https://roboticscenter.ai",
  "https://www.roboticscenter.ai",
];

function csv(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function hasAllowedWebScheme(url: URL): boolean {
  return (
    url.protocol === "https:" ||
    (url.protocol === "http:" && url.hostname === "localhost")
  );
}

function normalizedOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    if (!hasAllowedWebScheme(url)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function safePortalPath(
  value: string | string[] | null | undefined,
  fallback = "/launcher",
): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (
    !raw ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    raw.includes("://") ||
    /[\u0000-\u001f\u007f]/.test(raw)
  ) {
    return fallback;
  }
  return raw;
}

/**
 * Password recovery may finish in a trusted first-party application. Keep the
 * recovery callback itself on this portal, then use this allowlist for the
 * post-update destination. All other sign-in/OAuth returns stay portal paths.
 */
export function safeRecoveryReturnTarget(
  value: string | string[] | null | undefined,
  fallback = "/launcher",
): string {
  const safeFallback = safePortalPath(fallback);
  if (typeof value !== "string") return safeFallback;
  const raw = value.trim();
  if (
    !raw ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(raw)
  ) {
    return safeFallback;
  }
  if (raw.startsWith("/")) return safePortalPath(raw, safeFallback);
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return safeFallback;

  try {
    const candidate = new URL(raw);
    if (candidate.username || candidate.password) return safeFallback;
    if (!hasAllowedWebScheme(candidate)) return safeFallback;
    if (!allowedReturnOrigins().has(candidate.origin)) return safeFallback;
    return candidate.href;
  } catch {
    return safeFallback;
  }
}

export function allowedReturnOrigins(): Set<string> {
  const configured = csv("AUTH_ALLOWED_RETURN_ORIGINS")
    .map(normalizedOrigin)
    .filter((value): value is string => Boolean(value));
  return new Set([...DEFAULT_RETURN_ORIGINS, ...configured]);
}

export function safeExternalReturnUrl(
  value: string | null | undefined,
  fallback: string,
): URL {
  const fallbackUrl = new URL(fallback);
  if (!value) return fallbackUrl;
  try {
    const candidate = new URL(value);
    if (candidate.username || candidate.password) return fallbackUrl;
    if (!hasAllowedWebScheme(candidate)) return fallbackUrl;
    if (!allowedReturnOrigins().has(candidate.origin)) return fallbackUrl;
    return candidate;
  } catch {
    return fallbackUrl;
  }
}

export function isAllowedOAuthRequest(input: {
  clientId: string;
  redirectUri: string;
}): boolean {
  const clients = new Set(csv("AUTH_ALLOWED_OAUTH_CLIENT_IDS"));
  const redirects = new Set(csv("AUTH_ALLOWED_OAUTH_REDIRECT_URIS"));
  return clients.has(input.clientId) && redirects.has(input.redirectUri);
}

export function isAllowedOAuthRedirectUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password) return false;
    if (!hasAllowedWebScheme(url)) return false;
    const base = `${url.origin}${url.pathname}`;
    return new Set(csv("AUTH_ALLOWED_OAUTH_REDIRECT_URIS")).has(base);
  } catch {
    return false;
  }
}
