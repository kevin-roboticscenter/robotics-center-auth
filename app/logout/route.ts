import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { safeExternalReturnUrl } from "@/lib/auth/redirects";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut({ scope: "global" });
  const target = safeExternalReturnUrl(
    url.searchParams.get("return_to"),
    `${url.origin}/`,
  );
  return NextResponse.redirect(target);
}
