import { safePortalPath } from "./redirects";

export const AUTH_RETURN_COOKIE = "rc_portal_return";

export function stashPortalReturn(path: string): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_RETURN_COOKIE}=${encodeURIComponent(
    safePortalPath(path),
  )}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

export function readPortalReturn(cookieHeader: string | null): string {
  for (const item of (cookieHeader ?? "").split(";")) {
    const [name, ...rest] = item.trim().split("=");
    if (name !== AUTH_RETURN_COOKIE) continue;
    try {
      return safePortalPath(decodeURIComponent(rest.join("=")));
    } catch {
      return "/launcher";
    }
  }
  return "/launcher";
}

export function clearPortalReturn(response: {
  cookies: {
    set: (
      name: string,
      value: string,
      options: Record<string, unknown>,
    ) => void;
  };
}): void {
  response.cookies.set(AUTH_RETURN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    httpOnly: false,
  });
}
