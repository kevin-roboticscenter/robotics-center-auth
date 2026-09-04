import { AuthPortal } from "@/components/auth-portal";
import { safePortalPath } from "@/lib/auth/redirects";

type Props = {
  searchParams: Promise<{ mode?: string; return_to?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <AuthPortal
      initialMode={params.mode === "signup" ? "signup" : "signin"}
      returnTo={safePortalPath(params.return_to)}
    />
  );
}
