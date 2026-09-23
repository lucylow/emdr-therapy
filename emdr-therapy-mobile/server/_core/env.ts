function list(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  corsAllowedOrigins: list(process.env.CORS_ALLOWED_ORIGINS),
  oauthRedirectUris: list(process.env.OAUTH_REDIRECT_URIS),
  publicStoragePrefixes: list(process.env.PUBLIC_STORAGE_PREFIXES),
  sessionCookieDomain: process.env.SESSION_COOKIE_DOMAIN?.trim() || undefined,
};

export function assertProductionEnvironment(): void {
  if (!ENV.isProduction) return;

  const missing: string[] = [];
  if (!ENV.appId) missing.push("VITE_APP_ID");
  if (!ENV.databaseUrl) missing.push("DATABASE_URL");
  if (!ENV.oAuthServerUrl) missing.push("OAUTH_SERVER_URL");
  if (ENV.cookieSecret.length < 32)
    missing.push("JWT_SECRET (minimum 32 characters)");
  if (ENV.corsAllowedOrigins.length === 0) missing.push("CORS_ALLOWED_ORIGINS");
  if (ENV.oauthRedirectUris.length === 0) missing.push("OAUTH_REDIRECT_URIS");

  if (missing.length > 0) {
    throw new Error(
      `Production configuration is incomplete: ${missing.join(", ")}`,
    );
  }
}
