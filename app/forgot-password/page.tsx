import type { Metadata } from "next";
import { PreviewForm } from "@/components/preview-form";
import { safePortalPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Reset password",
};

type Props = { searchParams: Promise<{ return_to?: string }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { return_to: returnTo } = await searchParams;
  return <PreviewForm mode="forgot" returnTo={safePortalPath(returnTo)} />;
}
