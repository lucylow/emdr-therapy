import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { assertProductionEnvironment, ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port += 1) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

function configureCors(app: express.Express): void {
  const allowed = new Set(ENV.corsAllowedOrigins);
  if (!ENV.isProduction) {
    allowed.add("http://localhost:8081");
    allowed.add("http://127.0.0.1:8081");
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      if (!allowed.has(origin)) {
        res.status(403).json({ error: "Origin is not allowed" });
        return;
      }
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
}

async function startServer(): Promise<void> {
  assertProductionEnvironment();
  const app = express();
  const server = createServer(app);
  server.requestTimeout = 20_000;
  server.headersTimeout = 25_000;

  configureCors(app);
  app.use(express.json({ limit: "256kb" }));
  app.use(express.urlencoded({ limit: "64kb", extended: false }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext }),
  );

  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (!ENV.isProduction)
        console.error(
          "[api] unhandled request error",
          error instanceof Error ? error.name : "unknown",
        );
      if (!res.headersSent)
        res.status(500).json({ error: "The request could not be completed." });
    },
  );

  const preferredPort = Number.parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(
    Number.isFinite(preferredPort) ? preferredPort : 3000,
  );
  server.listen(port, "0.0.0.0", () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

void startServer().catch((error: unknown) => {
  console.error(
    "[api] startup failed",
    error instanceof Error ? error.message : "unknown",
  );
  process.exitCode = 1;
});
