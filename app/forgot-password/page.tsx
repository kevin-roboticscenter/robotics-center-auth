import type { Metadata } from "next";
import { PreviewForm } from "@/components/preview-form";
import { safeRecoveryReturnTarget } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Reset password",
};

type Props = {
  searchParams: Promise<{ return_to?: string | string[] }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { return_to: returnTo } = await searchParams;
  return (
    <PreviewForm
      mode="forgot"
      returnTo={safeRecoveryReturnTarget(returnTo)}
    />
  );
}
