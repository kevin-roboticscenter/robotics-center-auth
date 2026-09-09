import type { NextConfig } from "next";
import { allowedOAuthRedirectUris } from "./lib/auth/oauth-allowlist.ts";

const isDevelopment = process.env.NODE_ENV !== "production";

function oauthFormActionOrigins(): string[] {
  const origins = new Set<string>();

  for (const value of allowedOAuthRedirectUris()) {
    try {
      const url = new URL(value.trim());
      const isLocalDevelopmentUrl =
        isDevelopment &&
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

      if (
        !url.username &&
        !url.password &&
        (url.protocol === "https:" || isLocalDevelopmentUrl)
      ) {
        origins.add(url.origin);
      }
    } catch {
      // Invalid redirect entries stay blocked by the CSP.
    }
  }

  return [...origins];
}

const formActionSources = ["'self'", ...oauthFormActionOrigins()].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' https://*.supabase.co${isDevelopment ? " ws: http:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  `form-action ${formActionSources}`,
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
