import { describe, expect, test, vi } from "vitest";
import {
  AUTH_RETURN_COOKIE,
  clearPortalReturn,
  readPortalReturn,
} from "@/lib/auth/return-cookie";

describe("portal return cookie", () => {
  test("reads an encoded safe consent path", () => {
    expect(
      readPortalReturn(
        `other=value; ${AUTH_RETURN_COOKIE}=${encodeURIComponent(
          "/oauth/consent?authorization_id=abc",
        )}`,
      ),
    ).toBe("/oauth/consent?authorization_id=abc");
  });

  test.each([
    `${AUTH_RETURN_COOKIE}=${encodeURIComponent("https://evil.example")}`,
    `${AUTH_RETURN_COOKIE}=${encodeURIComponent("//evil.example")}`,
    `${AUTH_RETURN_COOKIE}=%E0%A4%A`,
    null,
  ])("falls back for missing or unsafe cookie %s", (cookie) => {
    expect(readPortalReturn(cookie)).toBe("/launcher");
  });

  test("clears the short-lived return cookie at the same path", () => {
    const set = vi.fn();
    clearPortalReturn({ cookies: { set } });
    expect(set).toHaveBeenCalledWith(AUTH_RETURN_COOKIE, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      httpOnly: false,
    });
  });
});
