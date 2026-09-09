import { NextResponse } from "next/server";
import { safeExternalReturnUrl } from "@/lib/auth/redirects";
import { hasSameOrigin } from "@/lib/auth/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const formData = await request.formData();
  const target = safeExternalReturnUrl(
    String(formData.get("return_to") ?? ""),
    `${requestUrl.origin}/`,
  );
  const responseHeaders = new Headers();
  const supabase = await createServerSupabaseClient(responseHeaders);
  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error) {
    return NextResponse.json(
      { error: "Sign out failed" },
      { status: 502, headers: responseHeaders },
    );
  }

  return NextResponse.redirect(target, {
    status: 303,
    headers: responseHeaders,
  });
}
