"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Brand } from "@/components/brand";
import { BackIcon, EyeIcon } from "@/components/icons";

type PreviewFormProps = {
  mode: "forgot" | "update";
};

export function PreviewForm({ mode }: PreviewFormProps) {
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const isForgot = mode === "forgot";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Frontend preview only — nothing was submitted.");
  }

  return (
    <AuthShell>
      <section className="auth-card auth-card-secondary">
        <div className="card-highlight" aria-hidden="true" />
        <Brand />
        <div className="secondary-heading">
          <p className="eyebrow">
            {isForgot ? "Account recovery" : "Secure your account"}
          </p>
          <h1>{isForgot ? "Reset your password" : "Choose a new password"}</h1>
          <p>
            {isForgot
              ? "Enter your email and we’ll send you a secure reset link."
              : "Use at least eight characters and choose a password you haven’t used before."}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isForgot ? (
            <label className="field-label">
              <span>Email address</span>
              <input
                className="text-input"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@company.com"
                required
              />
            </label>
          ) : (
            <>
              <label className="field-label">
                <span>New password</span>
                <span className="password-field">
                  <input
                    className="text-input"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    placeholder="8+ characters"
                    minLength={8}
                    required
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    <EyeIcon className="eye-icon" />
                  </button>
                </span>
              </label>
              <label className="field-label">
                <span>Confirm new password</span>
                <input
                  className="text-input"
                  type={showPassword ? "text" : "password"}
                  name="confirm-password"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  minLength={8}
                  required
                />
              </label>
            </>
          )}

          <button className="primary-button" type="submit">
            {isForgot ? "Send Reset Link" : "Update Password"}
          </button>
          <p className="preview-notice" aria-live="polite">
            {notice}
          </p>
        </form>

        <Link className="back-link" href="/">
          <BackIcon className="back-icon" />
          Back to sign in
        </Link>
      </section>
    </AuthShell>
  );
}
