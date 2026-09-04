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

function normalizedOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    if (url.protocol !== "https:" && url.hostname !== "localhost") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function safePortalPath(
  value: string | null | undefined,
  fallback = "/launcher",
): string {
  const raw = value?.trim();
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
    const base = `${url.origin}${url.pathname}`;
    return new Set(csv("AUTH_ALLOWED_OAUTH_REDIRECT_URIS")).has(base);
  } catch {
    return false;
  }
}
