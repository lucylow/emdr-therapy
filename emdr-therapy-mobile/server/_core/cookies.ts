import type { CookieOptions, Request } from "express";
import { ENV } from "./env";

function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : (forwardedProto?.split(",") ?? []);
  return protoList.some(
    (proto: string) => proto.trim().toLowerCase() === "https",
  );
}

/**
 * Cookies are host-only unless an explicit trusted domain is supplied. Avoid
 * deriving a parent domain from a request hostname because that can broaden a
 * production session's reach to unrelated subdomains.
 */
export function getSessionCookieOptions(
  req: Request,
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);
  return {
    ...(ENV.sessionCookieDomain ? { domain: ENV.sessionCookieDomain } : {}),
    httpOnly: true,
    path: "/",
    sameSite: secure ? "lax" : "lax",
    secure,
  };
}
