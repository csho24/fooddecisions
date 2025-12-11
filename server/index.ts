import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Health check endpoint - register early so it's available during startup
// This helps prevent 503 errors during cold starts
app.get("/health", (_req, res) => {
  const timestamp = new Date().toISOString();
  log(`Health check requested - responding with OK`);
  res.status(200).json({ status: "ok", timestamp });
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Start server listening EARLY so health endpoint can respond immediately
// This prevents 503 errors during cold starts when other routes are still initializing
const port = parseInt(process.env.PORT || "5000", 10);
httpServer.listen(
  port,
  "0.0.0.0",
  () => {
    log(`serving on port ${port}`);
  },
);

// Add error handling for server listen errors
httpServer.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    log(`Port ${port} is already in use`, "error");
  } else {
    log(`Server error: ${err.message}`, "error");
  }
  process.exit(1);
});

// Add global error handlers to prevent crashes
process.on("uncaughtException", (err) => {
  log(`Uncaught Exception: ${err.message}`, "error");
  log(err.stack || "", "error");
  // Don't exit - let the server continue running with health endpoint
});

process.on("unhandledRejection", (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, "error");
  // Don't exit - let the server continue running with health endpoint
});

(async () => {
  try {
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error ${status}: ${message}`, "error");
      res.status(status).json({ message });
      // Don't throw - just log the error to prevent crashes
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // Server is already listening (started earlier for health endpoint)
    // Other routes and static serving are now set up
    log("Server initialization complete");
  } catch (error) {
    log(`Failed to initialize server: ${error instanceof Error ? error.message : String(error)}`, "error");
    log(error instanceof Error ? error.stack || "" : "", "error");
    // Don't exit - health endpoint should still work even if other routes fail
  }
})();
