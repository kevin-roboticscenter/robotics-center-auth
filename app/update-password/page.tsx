import type { Metadata } from "next";
import { PreviewForm } from "@/components/preview-form";

export const metadata: Metadata = {
  title: "Choose a new password",
};

export default function UpdatePasswordPage() {
  return <PreviewForm mode="update" />;
}
