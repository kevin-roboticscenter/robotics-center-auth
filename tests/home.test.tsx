import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import HomePage from "@/app/page";
import { AuthPortal } from "@/components/auth-portal";
import { ApplicationUnavailable } from "@/components/application-unavailable";

async function renderHome(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<ReactElement<Record<string, unknown>>> {
  return (await HomePage({
    searchParams: Promise.resolve(searchParams),
  })) as ReactElement<Record<string, unknown>>;
}

describe("portal home", () => {
  test("opens signup only for an exact singleton signup mode", async () => {
    const signup = await renderHome({
      mode: "signup",
      return_to: "/oauth/client-start?intent=signup",
    });
    expect(signup.props).toMatchObject({
      initialMode: "signup",
      returnTo: "/oauth/client-start?intent=signup",
    });

    const duplicate = await renderHome({ mode: ["signup", "signin"] });
    expect(duplicate.props.initialMode).toBe("signin");

    const unknown = await renderHome({ mode: "create" });
    expect(unknown.props.initialMode).toBe("signin");
  });

  test("shows an informational page for exact deferred application sources", async () => {
    const platform = await renderHome({ source: "platform" });
    expect(platform.type).toBe(ApplicationUnavailable);
    expect(platform.props.application).toBe("platform");

    const centeros = await renderHome({ source: "centeros" });
    expect(centeros.type).toBe(ApplicationUnavailable);
    expect(centeros.props.application).toBe("centeros");
  });

  test("recognizes only the Platform's exact legacy redirect origin", async () => {
    const platform = await renderHome({
      redirect: "https://platform.roboticscenter.ai/data",
    });
    expect(platform.type).toBe(ApplicationUnavailable);
    expect(platform.props.application).toBe("platform");

    const lookalike = await renderHome({
      redirect: "https://platform.roboticscenter.ai.evil.example/data",
    });
    expect(lookalike.type).toBe(AuthPortal);
    expect(lookalike.props.returnTo).toBe("/launcher");
  });
});
