import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Brand } from "@/components/brand";
import { ConsentActions } from "@/components/consent-actions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  isAllowedOAuthRedirectUrl,
  isAllowedOAuthRequest,
} from "@/lib/auth/redirects";

type Props = {
  searchParams: Promise<{ authorization_id?: string }>;
};

export default async function ConsentPage({ searchParams }: Props) {
  const { authorization_id: authorizationId } = await searchParams;
  if (!authorizationId) redirect("/error?reason=missing_authorization");

  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    redirect(
      `/?return_to=${encodeURIComponent(
        `/oauth/consent?authorization_id=${authorizationId}`,
      )}`,
    );
  }

  const { data, error } =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error || !data) redirect("/error?reason=invalid_authorization");

  if (!("authorization_id" in data)) {
    if (!isAllowedOAuthRedirectUrl(data.redirect_url)) {
      redirect("/error?reason=untrusted_client");
    }
    redirect(data.redirect_url);
  }

  if (
    !isAllowedOAuthRequest({
      clientId: data.client.id,
      redirectUri: data.redirect_uri,
    })
  ) {
    redirect("/error?reason=untrusted_client");
  }

  const scopes = data.scope.split(" ").filter(Boolean);
  return (
    <AuthShell>
      <section className="auth-card auth-card-secondary consent-card">
        <div className="card-highlight" aria-hidden="true" />
        <Brand />
        <div className="secondary-heading">
          <p className="eyebrow">Secure connection</p>
          <h1>Continue to {data.client.name}</h1>
          <p>
            Confirm that this trusted Robotics Center application may use your
            account.
          </p>
        </div>
        {scopes.length ? (
          <ul className="consent-scopes">
            {scopes.map((scope) => (
              <li key={scope}>{scope}</li>
            ))}
          </ul>
        ) : null}
        <ConsentActions authorizationId={authorizationId} />
      </section>
    </AuthShell>
  );
}
