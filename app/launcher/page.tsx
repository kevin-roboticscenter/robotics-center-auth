import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Brand } from "@/components/brand";
import {
  ArrowIcon,
  CenterOsIcon,
  GlobeIcon,
  PlatformIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Choose an application",
};

const applications = [
  {
    name: "Robotics Center",
    description:
      "Shop robotics products, manage orders, and access your customer account.",
    href: "https://www.roboticscenter.ai/",
    domain: "roboticscenter.ai",
    className: "app-icon-blue",
    icon: GlobeIcon,
  },
  {
    name: "Data Platform",
    description:
      "Manage robotics data, deployments, analytics, and connected operations.",
    href: "https://platform.roboticscenter.ai/",
    domain: "platform.roboticscenter.ai",
    className: "app-icon-violet",
    icon: PlatformIcon,
  },
  {
    name: "CenterOS",
    description:
      "Open the operating workspace for teams, robots, workflows, and automation.",
    href: "https://centeros.roboticscenter.ai/",
    domain: "centeros.roboticscenter.ai",
    className: "app-icon-cyan",
    icon: CenterOsIcon,
  },
];

export default function LauncherPage() {
  return (
    <AuthShell wide>
      <section className="launcher-panel" aria-labelledby="launcher-title">
        <header className="launcher-header">
          <Brand compact />
          <Link className="quiet-button" href="/logout">
            Sign out
          </Link>
        </header>

        <div className="launcher-intro">
          <span className="preview-pill">Authentication preview</span>
          <h1 id="launcher-title">Where would you like to go?</h1>
          <p>
            One Robotics Center account will provide secure access across all
            three applications.
          </p>
        </div>

        <div className="app-grid">
          {applications.map((application) => {
            const Icon = application.icon;

            return (
              <a
                className="app-card"
                href={application.href}
                key={application.name}
              >
                <span className={`app-icon ${application.className}`}>
                  <Icon />
                </span>
                <span className="app-card-copy">
                  <strong>{application.name}</strong>
                  <span>{application.description}</span>
                  <small>{application.domain}</small>
                </span>
                <ArrowIcon className="app-arrow" />
              </a>
            );
          })}
        </div>

        <p className="launcher-note">
          Application links never carry access or refresh tokens in the URL.
        </p>
      </section>
    </AuthShell>
  );
}
