export type DeferredApplicationId = "platform" | "centeros";

const PLATFORM_ORIGIN = "https://platform.roboticscenter.ai";

function isLegacyPlatformRedirect(
  value: string | string[] | undefined,
): boolean {
  if (typeof value !== "string") return false;
  const raw = value.trim();
  if (
    !raw.startsWith("https://") ||
    raw.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(raw)
  ) {
    return false;
  }

  try {
    const url = new URL(raw);
    return (
      !url.username &&
      !url.password &&
      url.protocol === "https:" &&
      url.origin === PLATFORM_ORIGIN
    );
  } catch {
    return false;
  }
}

/**
 * Identifies an application only to choose informational copy. The result must
 * never authorize OAuth, select a callback, or construct a return URL.
 */
export function deferredApplicationFromQuery(input: {
  source?: string | string[];
  redirect?: string | string[];
}): DeferredApplicationId | null {
  if (input.source === "platform" || input.source === "centeros") {
    return input.source;
  }
  return isLegacyPlatformRedirect(input.redirect) ? "platform" : null;
}
