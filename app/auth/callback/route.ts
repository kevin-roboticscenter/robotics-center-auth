import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safePortalPath } from "@/lib/auth/redirects";
import {
  clearPortalReturn,
  readPortalReturn,
} from "@/lib/auth/return-cookie";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safePortalPath(
    url.searchParams.get("next") ||
      readPortalReturn(request.headers.get("cookie")),
  );

  if (code) {
    const responseHeaders = new Headers();
    const supabase = await createServerSupabaseClient(responseHeaders);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(new URL(next, url.origin), {
        headers: responseHeaders,
      });
      clearPortalReturn(response);
      return response;
    }

    const failure = new URL("/error", url.origin);
    failure.searchParams.set("reason", "callback");
    const response = NextResponse.redirect(failure, {
      headers: responseHeaders,
    });
    clearPortalReturn(response);
    return response;
  }

  const failure = new URL("/error", url.origin);
  failure.searchParams.set("reason", "callback");
  const response = NextResponse.redirect(failure);
  clearPortalReturn(response);
  return response;
}
