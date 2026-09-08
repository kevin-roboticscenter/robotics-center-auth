import { describe, expect, test } from "vitest";
import { hasSameOrigin } from "@/lib/auth/request";

function request(origin?: string) {
  const headers = new Headers();
  if (origin !== undefined) headers.set("origin", origin);
  return {
    headers,
    url: "https://login-preview.example/api/logout",
  };
}

describe("same-origin mutation protection", () => {
  test("accepts an exact same-origin request", () => {
    expect(hasSameOrigin(request("https://login-preview.example"))).toBe(true);
  });

  test.each([
    undefined,
    "null",
    "https://evil.example",
    "http://login-preview.example",
    "https://login-preview.example.evil.example",
  ])("rejects a missing or cross-origin value %s", (origin) => {
    expect(hasSameOrigin(request(origin))).toBe(false);
  });
});
