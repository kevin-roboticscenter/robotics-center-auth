import { describe, expect, test } from "vitest";
import {
  CONFIRMATION_RESEND_COOLDOWN_SECONDS,
  signupConfirmationResendParams,
} from "@/lib/auth/resend-confirmation";

describe("signup confirmation resend", () => {
  test("uses the signup flow and the Portal callback", () => {
    expect(
      signupConfirmationResendParams(
        "  test@example.com  ",
        "https://login-preview.example",
      ),
    ).toEqual({
      type: "signup",
      email: "test@example.com",
      options: {
        emailRedirectTo: "https://login-preview.example/auth/callback",
      },
    });
  });

  test("discards paths and queries from the supplied Portal URL", () => {
    expect(
      signupConfirmationResendParams(
        "test@example.com",
        "https://login-preview.example/unsafe?return_to=https://evil.example",
      ).options.emailRedirectTo,
    ).toBe("https://login-preview.example/auth/callback");
    expect(CONFIRMATION_RESEND_COOLDOWN_SECONDS).toBe(60);
  });
});
