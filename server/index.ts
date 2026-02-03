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

// Health/cron endpoint - tracks when cron hits the server
let cronHitCount = 0;
let lastCronHit: string | null = null;
const serverStartTime = new Date();

app.get("/health", (_req, res) => {
  try {
    cronHitCount++;
    lastCronHit = new Date().toISOString();
    const uptime = Math.floor((Date.now() - serverStartTime.getTime()) / 1000);
    
    log(`🔔 Cron hit #${cronHitCount}`);
    
    res.status(200).json({
      status: "ok",
      cronHitCount,
      lastCronHit,
      serverUptime: `${uptime}s`,
      serverStartTime: serverStartTime.toISOString()
    });
  } catch (error) {
    log(`Health check error: ${error instanceof Error ? error.message : String(error)}`, "error");
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  }
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
const port = parseInt(process.env.PORT || "3001", 10);
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
    log(`Run: lsof -ti :${port} | xargs kill -9`, "error");
  } else {
    log(`Server error: ${err.message}`, "error");
  }
  process.exit(1);
});

// Graceful shutdown handlers - CRITICAL to prevent zombie processes
const gracefulShutdown = (signal: string) => {
  log(`Received ${signal}, shutting down gracefully...`);
  httpServer.close(() => {
    log("HTTP server closed");
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    log("Forcing shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT")); // Ctrl+C

// Add global error handlers to prevent crashes but log them
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
    // Register routes - this should always succeed even if database is down
    // Routes will return errors if database fails, but they'll be registered
    await registerRoutes(httpServer, app);
    log("Routes registered successfully");

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Request Error ${status}: ${message}`, "error");
      res.status(status).json({ message });
      // Don't throw - just log the error to prevent crashes
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
      log("Static files serving configured");
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
      log("Vite dev server configured");
    }

    // Server is already listening (started earlier for health endpoint)
    // Other routes and static serving are now set up
    log("Server initialization complete - all systems ready");
  } catch (error) {
    log(`Failed to initialize server: ${error instanceof Error ? error.message : String(error)}`, "error");
    log(error instanceof Error ? error.stack || "" : "", "error");
    // Still register routes even if static serving fails
    try {
      await registerRoutes(httpServer, app);
      log("Routes registered after initial failure");
    } catch (routeError) {
      log(`Failed to register routes: ${routeError instanceof Error ? routeError.message : String(routeError)}`, "error");
    }
    // Don't exit - health endpoint should still work even if other routes fail
  }
})();
