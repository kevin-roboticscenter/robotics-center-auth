import type { Metadata } from "next";
import { PreviewForm } from "@/components/preview-form";
import { safePortalPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Choose a new password",
};

type Props = { searchParams: Promise<{ return_to?: string }> };

export default async function UpdatePasswordPage({ searchParams }: Props) {
  const { return_to: returnTo } = await searchParams;
  return <PreviewForm mode="update" returnTo={safePortalPath(returnTo)} />;
}
