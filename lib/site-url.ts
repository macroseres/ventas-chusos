import "server-only";

import { headers } from "next/headers";

function normalizeOrigin(value: string) {
  return value.replace(/\/$/, "");
}

export async function getAllowedRequestOrigin() {
  const requestOrigin = (await headers()).get("origin");
  const configuredOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    ...(process.env.ALLOWED_SITE_ORIGINS || "").split(","),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => normalizeOrigin(value.trim()));

  if (requestOrigin) {
    const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
    if (process.env.NODE_ENV === "development") return normalizedRequestOrigin;
    if (configuredOrigins.includes(normalizedRequestOrigin)) return normalizedRequestOrigin;
  }

  if (configuredOrigins[0]) return configuredOrigins[0];
  throw new Error("Falta configurar NEXT_PUBLIC_SITE_URL.");
}
