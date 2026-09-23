import { COOKIE_NAME, SESSION_TTL_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

function getString(req: Request, key: string): string | undefined {
  const value = req.method === "GET" ? req.query[key] : req.body?.[key];
  return typeof value === "string" && value.length > 0 && value.length <= 8_192
    ? value
    : undefined;
}

async function syncUser(userInfo: {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  platform?: string | null;
}) {
  if (!userInfo.openId)
    throw new Error("OAuth provider returned no user identifier");
  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn,
  });
  return (
    (await getUserByOpenId(userInfo.openId)) ?? {
      openId: userInfo.openId,
      name: userInfo.name,
      email: userInfo.email,
      loginMethod: userInfo.loginMethod ?? null,
      lastSignedIn,
    }
  );
}

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
      },
) {
  return {
    id: (user as any)?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

async function exchangeCode(code: string, state: string) {
  const tokenResponse = await sdk.exchangeCodeForToken(code, state);
  const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
  const user = await syncUser(userInfo);
  const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
    name: userInfo.name || "",
    expiresInMs: SESSION_TTL_MS,
  });
  return { user, sessionToken };
}

export function registerOAuthRoutes(app: Express): void {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getString(req, "code");
    const state = getString(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "Authentication response is incomplete" });
      return;
    }
    try {
      const { sessionToken } = await exchangeCode(code, state);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: SESSION_TTL_MS,
      });
      const frontendUrl =
        process.env.EXPO_WEB_PREVIEW_URL ||
        process.env.EXPO_PACKAGER_PROXY_URL ||
        "http://localhost:8081";
      res.redirect(302, frontendUrl);
    } catch (error) {
      if (!ENV.isProduction)
        console.error(
          "[oauth] web callback failed",
          error instanceof Error ? error.name : "unknown",
        );
      res.status(502).json({ error: "Authentication could not be completed" });
    }
  });

  app.post("/api/oauth/mobile", async (req: Request, res: Response) => {
    const code = getString(req, "code");
    const state = getString(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "Authentication response is incomplete" });
      return;
    }
    try {
      const { user, sessionToken } = await exchangeCode(code, state);
      res.json({ app_session_id: sessionToken, user: buildUserResponse(user) });
    } catch (error) {
      if (!ENV.isProduction)
        console.error(
          "[oauth] mobile exchange failed",
          error instanceof Error ? error.name : "unknown",
        );
      res.status(502).json({ error: "Authentication could not be completed" });
    }
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      res.json({ user: buildUserResponse(await sdk.authenticateRequest(req)) });
    } catch {
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      res.cookie(COOKIE_NAME, authHeader.slice("Bearer ".length).trim(), {
        ...getSessionCookieOptions(req),
        maxAge: SESSION_TTL_MS,
      });
      res.json({ success: true, user: buildUserResponse(user) });
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  });
}
