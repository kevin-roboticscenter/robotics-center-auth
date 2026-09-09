import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { describe, expect, test } from "vitest";
import { ApplicationUnavailable } from "@/components/application-unavailable";

function elements(node: ReactNode, type: string): ReactElement[] {
  if (!isValidElement(node)) return [];
  const current = node.type === type ? [node] : [];
  const props = node.props as { children?: ReactNode };
  return [
    ...current,
    ...Children.toArray(props.children).flatMap((child) =>
      elements(child, type),
    ),
  ];
}

function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (!isValidElement(node)) return "";
  return Children.toArray(
    (node.props as { children?: ReactNode }).children,
  )
    .map(textContent)
    .join(" ");
}

function hrefs(node: ReactNode): unknown[] {
  return elements(node, "a").map(
    (element) => (element.props as { href?: unknown }).href,
  );
}

function normalizedText(node: ReactNode): string {
  return textContent(node).replace(/\s+/g, " ").trim();
}

describe("unavailable application page", () => {
  test("shows Platform status with only hard-coded safe destinations", () => {
    const page = ApplicationUnavailable({ application: "platform" });

    expect(normalizedText(page)).toContain(
      "Data Platform sign-in isn’t available yet",
    );
    expect(hrefs(page)).toEqual([
      "https://platform.roboticscenter.ai/",
      "https://www.roboticscenter.ai/",
    ]);
    expect(elements(page, "form")).toHaveLength(0);
  });

  test("shows CenterOS status with only hard-coded safe destinations", () => {
    const page = ApplicationUnavailable({ application: "centeros" });

    expect(normalizedText(page)).toContain(
      "CenterOS sign-in isn’t available yet",
    );
    expect(hrefs(page)).toEqual([
      "https://centeros.roboticscenter.ai/",
      "https://www.roboticscenter.ai/",
    ]);
    expect(elements(page, "form")).toHaveLength(0);
  });
});
