import { NextResponse } from "next/server";
import {
  oauthClientReadyUrl,
  oauthClientStartPath,
  parseOAuthClientStart,
} from "@/lib/auth/oauth-client-start";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function privateHeaders(): Headers {
  return new Headers({
    "Cache-Control": "private, no-store",
    Pragma: "no-cache",
  });
}

function invalidStart(requestUrl: URL, headers = privateHeaders()) {
  const destination = new URL("/error", requestUrl.origin);
  destination.searchParams.set("reason", "invalid_oauth_start");
  return NextResponse.redirect(destination, { headers });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const start = parseOAuthClientStart(requestUrl.searchParams);
  if (!start) return invalidStart(requestUrl);

  const responseHeaders = privateHeaders();
  try {
    const supabase = await createServerSupabaseClient(responseHeaders);
    const { data } = await supabase.auth.getClaims();

    if (data?.claims) {
      return NextResponse.redirect(oauthClientReadyUrl(start), {
        headers: responseHeaders,
      });
    }

    const destination = new URL("/", requestUrl.origin);
    destination.searchParams.set("mode", "signup");
    destination.searchParams.set("return_to", oauthClientStartPath(start));
    return NextResponse.redirect(destination, { headers: responseHeaders });
  } catch {
    return invalidStart(requestUrl, responseHeaders);
  }
}
