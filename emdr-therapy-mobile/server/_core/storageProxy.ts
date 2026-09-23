import type { Express, Request, Response } from "express";
import { ENV } from "./env";

function isAllowedPublicKey(key: string): boolean {
  return ENV.publicStoragePrefixes.some((prefix) => key.startsWith(prefix));
}

/**
 * Presigns only explicitly configured public asset prefixes. User records and
 * private uploads must use an authenticated, ownership-checked route instead.
 */
export function registerStorageProxy(app: Express): void {
  app.get("/manus-storage/*", async (req: Request, res: Response) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key || !isAllowedPublicKey(key)) {
      res.status(404).send("Asset not found");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(503).send("Asset delivery is unavailable");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        `${ENV.forgeApiUrl.replace(/\/+$/, "")}/`,
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });
      if (!forgeResp.ok) {
        if (!ENV.isProduction)
          console.error("[storage] presign request failed", forgeResp.status);
        res.status(502).send("Asset delivery is unavailable");
        return;
      }
      const { url } = (await forgeResp.json()) as { url?: string };
      if (!url) {
        res.status(502).send("Asset delivery is unavailable");
        return;
      }
      res.set("Cache-Control", "public, max-age=3600");
      res.redirect(307, url);
    } catch (error) {
      if (!ENV.isProduction)
        console.error(
          "[storage] proxy failed",
          error instanceof Error ? error.name : "unknown",
        );
      res.status(502).send("Asset delivery is unavailable");
    }
  });
}
