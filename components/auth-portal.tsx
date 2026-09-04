"use client";

import Link from "next/link";
import { FormEvent, useId, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Brand } from "@/components/brand";
import { EyeIcon, GoogleIcon, ShieldIcon } from "@/components/icons";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safePortalPath } from "@/lib/auth/redirects";
import { stashPortalReturn } from "@/lib/auth/return-cookie";

type AuthMode = "signin" | "signup";

export function AuthPortal({
  initialMode = "signin",
  returnTo = "/launcher",
}: {
  initialMode?: AuthMode;
  returnTo?: string;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const formId = useId();
  const next = safePortalPath(returnTo);

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setNotice("");
    setError("");
    setShowPassword(false);
  }

  function finish() {
    window.location.assign(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = new FormData(event.currentTarget);
      const email = String(data.get("email") ?? "").trim();
      const password = String(data.get("password") ?? "");
      const supabase = createBrowserSupabaseClient();

      if (mode === "signin") {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        finish();
        return;
      }

      const firstName = String(data.get("given-name") ?? "").trim();
      const lastName = String(data.get("family-name") ?? "").trim();
      stashPortalReturn(next);
      const { data: signup, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
          },
        },
      });
      if (signupError) throw signupError;
      if (signup.session) {
        finish();
        return;
      }
      setNotice("Check your email to confirm your account, then continue sign in.");
    } catch {
      setError("We couldn’t complete that request. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      stashPortalReturn(next);
      const supabase = createBrowserSupabaseClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (oauthError) throw oauthError;
    } catch {
      setError("Google sign in could not be started. Please try again.");
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="card-highlight" aria-hidden="true" />
        <Brand />

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            className={mode === "signin" ? "auth-tab active" : "auth-tab"}
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            aria-controls={formId}
            onClick={() => selectMode("signin")}
          >
            Sign In
          </button>
          <button
            className={mode === "signup" ? "auth-tab active" : "auth-tab"}
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            aria-controls={formId}
            onClick={() => selectMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <div id={formId} role="tabpanel">
          <h1 id="auth-title" className="sr-only">
            {mode === "signin"
              ? "Sign in to Silicon Valley Robotics Center"
              : "Create your Silicon Valley Robotics Center account"}
          </h1>

          <button
            className="oauth-button"
            type="button"
            disabled={busy || !isSupabaseConfigured()}
            onClick={() => void handleGoogle()}
          >
            <GoogleIcon className="google-icon" />
            Continue with Google
          </button>

          <div className="divider" aria-hidden="true">
            <span>or</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <div className="field-row">
                <label className="field-label">
                  <span>First name</span>
                  <input
                    className="text-input"
                    type="text"
                    name="given-name"
                    autoComplete="given-name"
                    placeholder="Ada"
                    required
                  />
                </label>
                <label className="field-label">
                  <span>Last name</span>
                  <input
                    className="text-input"
                    type="text"
                    name="family-name"
                    autoComplete="family-name"
                    placeholder="Lovelace"
                    required
                  />
                </label>
              </div>
            ) : null}

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

            <label className="field-label">
              <span>Password</span>
              <span className="password-field">
                <input
                  className="text-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  placeholder={
                    mode === "signin" ? "Enter your password" : "8+ characters"
                  }
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

            {mode === "signin" ? (
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" name="remember" />
                  <span>Keep me signed in</span>
                </label>
                <Link
                  href={`/forgot-password?return_to=${encodeURIComponent(next)}`}
                >
                  Forgot password?
                </Link>
              </div>
            ) : (
              <p className="form-assurance">
                By creating an account, you agree to the Robotics Center terms
                and privacy policy.
              </p>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={busy || !isSupabaseConfigured()}
            >
              {busy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>

            <p className="preview-notice" aria-live="polite">
              {!isSupabaseConfigured()
                ? "Authentication is not configured for this Preview deployment."
                : notice}
            </p>
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        </div>

        <div className="security-note">
          <ShieldIcon className="security-icon" />
          <span>Protected by secure, encrypted authentication</span>
        </div>
      </section>
    </AuthShell>
  );
}
