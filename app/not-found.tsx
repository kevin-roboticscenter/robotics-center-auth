import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Brand } from "@/components/brand";

export default function NotFound() {
  return (
    <AuthShell>
      <section className="auth-card auth-card-secondary error-card">
        <div className="card-highlight" aria-hidden="true" />
        <Brand />
        <p className="error-code">404</p>
        <div className="secondary-heading">
          <h1>Page not found</h1>
          <p>The page you were looking for isn’t part of the login portal.</p>
        </div>
        <Link className="primary-button button-link" href="/">
          Return to Sign In
        </Link>
      </section>
    </AuthShell>
  );
}
