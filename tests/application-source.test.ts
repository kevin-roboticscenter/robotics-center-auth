import { describe, expect, test } from "vitest";
import { deferredApplicationFromQuery } from "@/lib/auth/application-source";

describe("deferred application query detection", () => {
  test("accepts only exact, singleton application source labels", () => {
    expect(deferredApplicationFromQuery({ source: "platform" })).toBe(
      "platform",
    );
    expect(deferredApplicationFromQuery({ source: "centeros" })).toBe(
      "centeros",
    );
    expect(deferredApplicationFromQuery({ source: "Platform" })).toBeNull();
    expect(
      deferredApplicationFromQuery({ source: ["platform", "centeros"] }),
    ).toBeNull();
  });

  test("recognizes the Platform's current legacy redirect by exact origin", () => {
    expect(
      deferredApplicationFromQuery({
        redirect: "https://platform.roboticscenter.ai/data?tab=operations",
      }),
    ).toBe("platform");
  });

  test.each([
    "http://platform.roboticscenter.ai/data",
    "https://platform.roboticscenter.ai.evil.example/data",
    "https://user@platform.roboticscenter.ai/data",
    "https://centeros.roboticscenter.ai/",
    "javascript:alert(1)",
  ])("rejects an untrusted legacy redirect: %s", (redirect) => {
    expect(deferredApplicationFromQuery({ redirect })).toBeNull();
  });

  test("rejects duplicate legacy redirect values", () => {
    expect(
      deferredApplicationFromQuery({
        redirect: [
          "https://platform.roboticscenter.ai/",
          "https://evil.example/",
        ],
      }),
    ).toBeNull();
  });
});
