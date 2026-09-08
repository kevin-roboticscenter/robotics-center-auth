import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import HomePage from "@/app/page";

type AuthPortalProps = {
  initialMode: "signin" | "signup";
  returnTo: string;
};

async function renderHome(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<ReactElement<AuthPortalProps>> {
  return HomePage({ searchParams: Promise.resolve(searchParams) });
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
});
