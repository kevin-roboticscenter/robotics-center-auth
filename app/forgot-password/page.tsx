import type { Metadata } from "next";
import { PreviewForm } from "@/components/preview-form";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage() {
  return <PreviewForm mode="forgot" />;
}
