import { AuthPortal } from "@/components/auth-portal";
import { ApplicationUnavailable } from "@/components/application-unavailable";
import { deferredApplicationFromQuery } from "@/lib/auth/application-source";
import { safePortalPath } from "@/lib/auth/redirects";

type Props = {
  searchParams: Promise<{
    mode?: string | string[];
    redirect?: string | string[];
    return_to?: string | string[];
    source?: string | string[];
  }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const deferredApplication = deferredApplicationFromQuery(params);
  if (deferredApplication) {
    return <ApplicationUnavailable application={deferredApplication} />;
  }

  return (
    <AuthPortal
      initialMode={params.mode === "signup" ? "signup" : "signin"}
      returnTo={safePortalPath(params.return_to)}
    />
  );
}
