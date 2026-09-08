import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isAllowedOAuthRedirectUrl,
  isAllowedOAuthRequest,
} from "@/lib/auth/redirects";
import { hasSameOrigin } from "@/lib/auth/request";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const formData = await request.formData();
  const authorizationId = String(formData.get("authorization_id") ?? "");
  const decision = formData.get("decision");
  if (!authorizationId || (decision !== "approve" && decision !== "deny")) {
    return NextResponse.json({ error: "Invalid authorization decision" }, { status: 400 });
  }

  const responseHeaders = new Headers();
  const supabase = await createServerSupabaseClient(responseHeaders);
  const details =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (
    details.error ||
    !details.data ||
    !("authorization_id" in details.data) ||
    !isAllowedOAuthRequest({
      clientId: details.data.client.id,
      redirectUri: details.data.redirect_uri,
    })
  ) {
    return NextResponse.json(
      { error: "Untrusted OAuth client" },
      { status: 403, headers: responseHeaders },
    );
  }

  const result =
    decision === "approve"
      ? await supabase.auth.oauth.approveAuthorization(authorizationId, {
          skipBrowserRedirect: true,
        })
      : await supabase.auth.oauth.denyAuthorization(authorizationId, {
          skipBrowserRedirect: true,
        });

  if (
    result.error ||
    !result.data?.redirect_url ||
    !isAllowedOAuthRedirectUrl(result.data.redirect_url)
  ) {
    return NextResponse.json(
      { error: "Authorization failed" },
      { status: 400, headers: responseHeaders },
    );
  }
  return NextResponse.redirect(result.data.redirect_url, {
    status: 303,
    headers: responseHeaders,
  });
}
