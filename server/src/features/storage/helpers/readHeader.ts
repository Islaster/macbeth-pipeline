// Google's library hands back headers in two shapes depending on its version; this reads either.
export function readHeader(headers: unknown, name: string): string | undefined {
  if (headers instanceof Headers) return headers.get(name) ?? undefined;
  const value = (headers as Record<string, unknown> | null)?.[name];
  return typeof value === "string" ? value : undefined;
}
