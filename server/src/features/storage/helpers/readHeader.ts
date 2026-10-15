// Google's library hands back headers in two shapes depending on its version:
// a Headers-like object with get(), or a plain object with lowercase keys. This reads either.
export function readHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;

  const withGet = headers as { get?: (name: string) => string | null };
  if (typeof withGet.get === "function") return withGet.get(name) ?? undefined;

  const value = (headers as Record<string, unknown>)[name.toLowerCase()];
  return typeof value === "string" ? value : undefined;
}
