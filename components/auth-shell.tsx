type AuthShellProps = {
  children: React.ReactNode;
  wide?: boolean;
};

export function AuthShell({ children, wide = false }: AuthShellProps) {
  return (
    <main className="auth-shell">
      <div className="background-grid" aria-hidden="true" />
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className={wide ? "shell-content shell-content-wide" : "shell-content"}>
        {children}
      </div>
      <footer className="site-footer" aria-label="Authentication service details">
        <span>roboticscenter.ai</span>
        <span className="footer-dot" aria-hidden="true" />
        <span>Secure Login</span>
        <span className="footer-dot" aria-hidden="true" />
        <span>SSO</span>
      </footer>
    </main>
  );
}
