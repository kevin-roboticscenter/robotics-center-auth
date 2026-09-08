import {
  hasAllowedWebScheme,
  isAllowedOAuthRequest,
} from "./redirects";

const CLIENT_START_PARAMS = new Set([
  "intent",
  "client_id",
  "redirect_uri",
  "next",
]);

export type OAuthClientStart = {
  intent: "signup";
  clientId: string;
  redirectUri: string;
  next: string;
};

function singleton(
  params: URLSearchParams,
  name: string,
): string | null {
  const values = params.getAll(name);
  return values.length === 1 ? values[0] : null;
}

function safeClientPath(value: string): string | null {
  const path = value.trim();
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    path.includes("://") ||
    /[\u0000-\u001f\u007f]/.test(path)
  ) {
    return null;
  }
  return path;
}

/** Validate and normalize the Website's pre-authentication handoff. */
export function parseOAuthClientStart(
  params: URLSearchParams,
): OAuthClientStart | null {
  for (const name of params.keys()) {
    if (!CLIENT_START_PARAMS.has(name)) return null;
  }

  const intent = singleton(params, "intent");
  const clientId = singleton(params, "client_id");
  const redirectUri = singleton(params, "redirect_uri");
  const rawNext = singleton(params, "next");
  if (
    intent !== "signup" ||
    !clientId ||
    !redirectUri ||
    rawNext === null
  ) {
    return null;
  }

  const next = safeClientPath(rawNext);
  if (!next) return null;

  try {
    const callback = new URL(redirectUri);
    if (callback.username || callback.password) return null;
    if (!hasAllowedWebScheme(callback)) return null;
  } catch {
    return null;
  }

  if (!isAllowedOAuthRequest({ clientId, redirectUri })) return null;
  return { intent, clientId, redirectUri, next };
}

export function oauthClientStartPath(input: OAuthClientStart): string {
  const params = new URLSearchParams({
    intent: input.intent,
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    next: input.next,
  });
  return `/oauth/client-start?${params.toString()}`;
}

export function oauthClientReadyUrl(input: OAuthClientStart): URL {
  const destination = new URL("/auth/sso/start", input.redirectUri);
  destination.search = new URLSearchParams({
    next: input.next,
    intent: input.intent,
    portal_ready: "1",
  }).toString();
  return destination;
}
