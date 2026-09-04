"use client";

import Link from "next/link";
import { FormEvent, useId, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Brand } from "@/components/brand";
import { EyeIcon, GoogleIcon, ShieldIcon } from "@/components/icons";

type AuthMode = "signin" | "signup";

export function AuthPortal() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const formId = useId();

  function selectMode(nextMode: AuthMode) {
    setMode(nextMode);
    setNotice("");
    setShowPassword(false);
  }

  function handlePreviewAction(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setNotice("Frontend preview only — nothing was submitted.");
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
            onClick={() => handlePreviewAction()}
          >
            <GoogleIcon className="google-icon" />
            Continue with Google
          </button>

          <div className="divider" aria-hidden="true">
            <span>or</span>
          </div>

          <form className="auth-form" onSubmit={handlePreviewAction}>
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
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
            ) : (
              <p className="form-assurance">
                By creating an account, you agree to the Robotics Center terms
                and privacy policy.
              </p>
            )}

            <button className="primary-button" type="submit">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>

            <p className="preview-notice" aria-live="polite">
              {notice}
            </p>
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
