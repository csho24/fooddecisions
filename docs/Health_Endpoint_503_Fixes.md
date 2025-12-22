# Health Endpoint 503 Errors - Issue and Fixes

**Date:** December 8, 2024  
**Issue:** Cron job health checks returning 503 errors during cold starts  
**Status:** ✅ Resolved

---

## Problem Summary

A cron job was configured to ping `https://fooddecisions.onrender.com/health` every 10 minutes to keep the Render instance awake and prevent cold starts. However, the health checks were failing with **503 Service Unavailable** errors, especially during:
- Cold starts (after periods of inactivity)
- Specific time periods (evening/night hours)
- Server restarts

The cron job service eventually auto-disabled itself after repeated failures.

---

## Root Cause Analysis

### Initial Implementation Issue

The `/health` endpoint was originally registered **inside** the async startup function, which meant:

1. **Server startup sequence:**
   ```
   Express app created
   → Middleware registered
   → Async function starts
   → Routes registered (including /health)
   → Static serving set up
   → Server starts listening ← Health endpoint only available here
   ```

2. **Problem:** During cold starts, if `registerRoutes()` or `serveStatic()` took time to initialize (especially database connections), the server wouldn't be listening yet. When the cron job hit `/health` during this window, it received a 503 error because:
   - The server wasn't accepting connections yet
   - The route wasn't registered yet
   - Render's load balancer returned 503 "Service Unavailable"

### Why It Failed During Specific Hours

The pattern of failures (successful until 7:30pm, then failures until 9:45pm, etc.) suggested:
- Render's free tier instances spin down after inactivity
- Cold starts take 30+ seconds
- Cron job hitting every 10 minutes wasn't frequent enough to prevent spin-downs
- When the server was spinning up, health checks during initialization returned 503s

---

## Fixes Implemented

### Fix 1: Early Health Endpoint Registration

**Commit:** `735b449` - "Add /health endpoint for cron job monitoring"

**Change:** Moved `/health` endpoint registration to **before** the async startup function:

```typescript
// Health check endpoint - register early so it's available during startup
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ... middleware setup ...

(async () => {
  // Routes registered here
  await registerRoutes(httpServer, app);
  // ...
})();
```

**Result:** Health endpoint route was registered synchronously, but server still wasn't listening yet.

---

### Fix 2: Early Server Listening

**Commit:** `083216c` - "Fix: Start server listening immediately so health endpoint responds during cold starts"

**Change:** Moved `httpServer.listen()` to **before** the async startup function:

```typescript
// Health check endpoint registered
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server listening EARLY so health endpoint can respond immediately
const port = parseInt(process.env.PORT || "5000", 10);
httpServer.listen(
  {
    port,
    host: "0.0.0.0",
    reusePort: true,
  },
  () => {
    log(`serving on port ${port}`);
  },
);

// NOW start async initialization
(async () => {
  await registerRoutes(httpServer, app);
  // ... rest of setup
})();
```

**Result:** Server starts accepting connections immediately after health endpoint is registered, allowing it to respond even while other routes are still initializing.

---

### Fix 3: Static Middleware Exclusion

**Commit:** `735b449` - Updated `server/static.ts`

**Change:** Ensured static file serving doesn't catch the `/health` route:

```typescript
// Exclude health check and API routes from catch-all
app.use((req, res, next) => {
  if (req.path === "/health" || req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.resolve(distPath, "index.html"));
});
```

**Result:** Health endpoint won't be caught by the SPA catch-all route.

---

## Final Server Startup Sequence

After fixes, the startup sequence is:

```
1. Express app created
2. Middleware registered (CORS, JSON parsing, etc.)
3. Health endpoint registered ← Available immediately
4. Server starts listening ← Accepts connections immediately
5. Async function starts:
   - Routes registered (API endpoints)
   - Error handlers set up
   - Static serving configured
6. All routes available
```

**Key improvement:** Health endpoint can respond **immediately** when the server starts, even if database connections or other routes are still initializing.

---

## Health Endpoint Details

**URL:** `https://fooddecisions.onrender.com/health`  
**Method:** GET  
**Response:** 
```json
{
  "status": "ok",
  "timestamp": "2025-12-08T13:57:10.335Z"
}
```
**Status Code:** 200 OK

**Purpose:**
- Keep Render instance awake (prevent cold starts)
- Monitor server availability
- Quick health check for monitoring systems

---

## Cron Job Configuration

**Service:** External cron job service (configured separately)  
**Frequency:** Every 10 minutes  
**Endpoint:** `https://fooddecisions.onrender.com/health`  
**Expected Response:** 200 OK with JSON body

---

## Verification

After fixes were deployed:
- ✅ Health endpoint responds immediately during cold starts
- ✅ No more 503 errors during server initialization
- ✅ Cron job successfully pings the endpoint
- ✅ Render instance stays awake

---

## Lessons Learned

1. **Server listening order matters:** For health checks to work during cold starts, the server must start listening **before** heavy initialization tasks (database connections, route registration).

2. **Early route registration:** Critical endpoints like health checks should be registered synchronously, not inside async initialization functions.

3. **Render free tier limitations:** 
   - Cold starts take 30+ seconds
   - Instances spin down after ~15 minutes of inactivity
   - Health checks need to succeed immediately to prevent spin-downs

4. **Monitoring during failures:** The cron job service auto-disabled after repeated failures, which helped identify the issue but required manual re-enabling after fixes.

---

## Related Files

- `server/index.ts` - Main server file with health endpoint and early listening
- `server/static.ts` - Static file serving with health endpoint exclusion
- `server/routes.ts` - API routes (registered after server starts listening)

---

## Status

**✅ Resolved** - Health endpoint now responds immediately during cold starts, preventing 503 errors and keeping the Render instance awake.













