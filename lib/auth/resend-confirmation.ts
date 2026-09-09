export const CONFIRMATION_RESEND_COOLDOWN_SECONDS = 60;

export function signupConfirmationResendParams(
  email: string,
  portalOrigin: string,
) {
  const origin = new URL(portalOrigin).origin;
  return {
    type: "signup" as const,
    email: email.trim(),
    options: {
      emailRedirectTo: new URL("/auth/callback", origin).toString(),
    },
  };
}
