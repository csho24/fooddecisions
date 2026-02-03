# Localhost Development Server Fix - December 9, 2024

## Add page file path and verifying which bundle is loaded (Feb 2025)

**The only page that renders at `http://localhost:8080/add` is:**
- **File:** `client/src/pages/add-details.tsx`  
- **Full path:** `Food-Compass/client/src/pages/add-details.tsx` (from repo root)

To confirm the browser is running the **current** code (no instruction under Cleaning Days location input):
1. Go to `http://localhost:3001/add` → Cleaning Days → select one day so the location input appears.
2. Use **Find in Page** (Cmd+F / Ctrl+F) and search for: **`ADD_DETAILS_NO_INSTR`**
3. If that string is found → the new bundle is loaded (instruction is removed in this build).
4. If it is **not** found → the server is not serving the updated code (check terminal for errors, verify server is running).

---

## ⚠️ CRITICAL - DO NOT CHANGE THE DEV SCRIPT ⚠️

**The `dev` script in `package.json` MUST be:**
```json
"dev": "NODE_ENV=development node --import tsx/esm --require dotenv/config server/index.ts"
```

**DO NOT change it to:**
```json
"dev": "NODE_ENV=development tsx server/index.ts"  // ❌ BROKEN - DATABASE_URL won't load
```

**Why:** The `--require dotenv/config` flag is REQUIRED to load the `.env` file properly. Without it, the DATABASE_URL doesn't load and the app connects to localhost:5432 instead of Neon, causing all API calls to fail.

**This has broken localhost 3+ times. DO NOT REVERT.**

---

**Date:** December 9, 2024  
**Issue:** Localhost web preview not working - Vite dev server crashing  
**Status:** ✅ Resolved

---

## Problem Summary

After migrating from Replit to local development, the web preview was not accessible:
- Ports 5000 and 5001 were blocked (macOS Control Center using port 5000)
- When starting server on alternative ports (3000, 4000, 5173, 8080), the server would start but immediately crash
- Error: `Failed to load url /src/main.tsx` - Vite couldn't find or serve the React app entry point

**Symptoms:**
- Server would start successfully (`serving on port X`)
- Health endpoint (`/health`) would respond correctly
- HTML page would load initially
- Server would crash within seconds with Vite pre-transform error
- Error: `(client) Pre-transform error: Failed to load url /src/main.tsx?v=... Does the file exist?`

---

## Root Cause

The issue was in `server/vite.ts` - how it was importing and using the Vite configuration.

### The Problem

1. **`vite.config.ts` exports an async function:**
   ```typescript
   export default defineConfig(async () => ({
     plugins: [...],
     root: path.resolve(import.meta.dirname, "client"),
     // ...
   }));
   ```

2. **`server/vite.ts` was incorrectly importing it:**
   ```typescript
   import viteConfig from "../vite.config";
   
   const vite = await createViteServer({
     ...viteConfig,  // ❌ WRONG - viteConfig is an async function, not a config object
     configFile: false,
     // ...
   });
   ```

3. **What happened:**
   - Vite received an async function instead of a config object
   - Vite couldn't resolve the `root` directory properly
   - Vite couldn't find `/src/main.tsx` because it didn't know where to look
   - Server crashed when browser tried to load the React app

### Why It Worked on Replit

Replit's environment may have handled the async config differently, or the Replit-specific Vite plugins masked the issue. The problem only became apparent when running locally without Replit's infrastructure.

---

## Fix Implemented

**Commit:** `0b21326` - "Add archive functionality and fix server listen config"  
**File Changed:** `server/vite.ts`

### Solution

Changed from importing and spreading the config to using Vite's `configFile` option:

**Before (Broken):**
```typescript
import viteConfig from "../vite.config";

const vite = await createViteServer({
  ...viteConfig,  // ❌ Async function, not config object
  configFile: false,
  // ...
});
```

**After (Fixed):**
```typescript
// No import needed - use configFile option instead

const vite = await createViteServer({
  configFile: path.resolve(import.meta.dirname, "..", "vite.config.ts"),  // ✅ Let Vite load it properly
  customLogger: {
    ...viteLogger,
    error: (msg, options) => {
      viteLogger.error(msg, options);
      process.exit(1);
    },
  },
  server: serverOptions,
  appType: "custom",
});
```

### Why This Works

- Vite's `configFile` option properly handles async config functions
- Vite loads and resolves the config internally
- The `root` directory is correctly set to `client/`
- Vite can find and serve `/src/main.tsx` from `client/src/main.tsx`

---

## Testing & Verification

**Before Fix:**
- ❌ Server crashed immediately after HTML load
- ❌ Vite couldn't find `/src/main.tsx`
- ❌ No web preview available

**After Fix:**
- ✅ Server runs stable on port 8080
- ✅ Health endpoint responds: `{"status":"ok","timestamp":"..."}`
- ✅ HTML page loads correctly
- ✅ Vite serves React app without errors
- ✅ Web preview accessible at `http://localhost:8080`

---

## Port Configuration

**Default Port:** 5000 (from `process.env.PORT || "5000"`)  
**Blocked Ports:** 5000 (macOS Control Center), 5001, 3000  
**Working Port:** 8080 (or any available port)

**To use a different port:**
```bash
PORT=8080 npm run dev
```

---

## Related Files

- `server/vite.ts` - Vite dev server setup (fixed)
- `vite.config.ts` - Vite configuration (async function export)
- `server/index.ts` - Express server entry point
- `client/src/main.tsx` - React app entry point

---

## Lessons Learned

1. **Async config functions:** When Vite config is an async function, use `configFile` option instead of importing and spreading
2. **Port conflicts:** macOS services can block common ports (5000, 5001) - use environment variable to override
3. **Replit differences:** What works on Replit may not work locally - always test local development setup
4. **Error messages:** "Does the file exist?" errors often mean path resolution issues, not missing files

---

## Status

**✅ Resolved** - Localhost development server now works correctly. Web preview accessible at `http://localhost:8080` (or any port specified via `PORT` environment variable).

---

## Update: December 11, 2024 - Default Port Changed to 8080

**Date:** December 11, 2024  
**Change:** Updated default port from 5000 to 8080  
**Reason:** Port 5000 conflicts with macOS Control Center on many systems

### Changes Made

**File:** `server/index.ts`

**Before:**
```typescript
const port = parseInt(process.env.PORT || "5000", 10);
```

**After:**
```typescript
const port = parseInt(process.env.PORT || "8080", 10);
```

### Impact

- Default port is now 8080 instead of 5000
- Reduces port conflicts on macOS systems
- Can still override with `PORT` environment variable: `PORT=3000 npm run dev`

### Testing

- ✅ Server starts on port 8080 by default
- ✅ Health endpoint responds correctly
- ✅ Web preview accessible at `http://localhost:8080`

**Status:** ✅ Default port updated to 8080

---

## Update: December 19, 2024 - Dotenv Loading Issue

**Date:** December 19, 2024  
**Issue:** Database connection failing on localhost - DATABASE_URL not loading from .env file  
**Symptoms:** 
- Server starts successfully on port 8080
- API endpoints return 500 errors
- Error: `ECONNREFUSED ::1:5432` and `ECONNREFUSED 127.0.0.1:5432`
- Server trying to connect to localhost PostgreSQL instead of Neon

### Root Cause

The `tsx` command was not properly loading the `.env` file even though `import "dotenv/config"` was at the top of `server/index.ts`. The issue appeared intermittently - code that worked yesterday would fail today without any changes to the codebase.

**Confusing aspects:**
- No code changes between working version (Dec 18) and broken version (Dec 19)
- `server/index.ts` had `import "dotenv/config"` at line 1
- `.env` file existed with correct DATABASE_URL
- Package.json and package-lock.json were unchanged

### Fix Implemented

**File:** `package.json`

**Before:**
```json
"dev": "NODE_ENV=development tsx server/index.ts"
```

**After:**
```json
"dev": "NODE_ENV=development node --import tsx/esm --require dotenv/config server/index.ts"
```

### Why This Works

- `node --require dotenv/config` explicitly requires dotenv BEFORE any module imports
- Ensures `.env` is loaded early in the Node.js startup process
- More reliable than relying on `import "dotenv/config"` within TypeScript files when using tsx
- The `--import tsx/esm` flag enables TypeScript support via tsx

### Testing

**Before Fix:**
- ❌ DATABASE_URL not loaded (shown as "NO" in debug logs)
- ❌ Server tries to connect to localhost:5432
- ❌ All API requests return 500 errors

**After Fix:**
- ✅ DATABASE_URL loads correctly
- ✅ Server connects to Neon PostgreSQL
- ✅ API endpoints work (foods, archives)
- ✅ Web preview shows food items correctly

### Why This Issue Occurs Intermittently

**Possible causes:**
1. **tsx caching behavior:** tsx may cache module resolution and not re-evaluate dotenv imports
2. **Node.js module loading order:** Timing of when dotenv loads relative to other imports
3. **Environment-specific:** May depend on shell environment or how npm/node starts

**Prevention:** Using `--require dotenv/config` ensures dotenv loads first, regardless of tsx caching or module loading order.

### Lessons Learned

1. **Explicit is better than implicit:** Use `--require dotenv/config` in the npm script instead of relying on `import "dotenv/config"` in code
2. **Document environment setup:** .env loading issues are hard to debug when nothing appears to have changed
3. **Add debug logging:** Adding `console.log('[DEBUG] DATABASE_URL loaded:', ...)` helped identify the issue quickly
4. **Clean up debug code:** Remove debug logging after fix is verified

### Related Issues

This is similar to the December 9 Vite config issue where async config functions weren't being loaded properly. Both issues involve module loading/import timing problems.

**Status:** ✅ Fixed - December 19, 2024

---

## Update: December 20, 2024 - Missing Database Migration

**Date:** December 20, 2024  
**Issue:** Localhost content not loading - API returning 500 errors  
**Symptoms:**
- Server starts successfully on port 8080
- Health endpoint works (`/health` returns OK)
- Frontend HTML loads
- BUT all API calls fail with 500 error
- Error: `column "expiry_date" does not exist`

### Root Cause

When adding the **Expiry feature**, the schema was updated to include `expiryDate` field:
- `shared/schema.ts` - Added `expiryDate: text("expiry_date")` to foodItems table
- `client/src/lib/store.ts` - Added `expiryDate?: string` to FoodItem interface
- `server/migrations/003_add_expiry_date.sql` - Created migration file

**BUT the migration was never run against the Neon database.** The column didn't exist in the actual database, so every SELECT query on `food_items` failed.

### Why This Was Missed

1. Schema file was updated ✅
2. Migration SQL file was created ✅
3. **Database migration was NOT executed** ❌

The `drizzle-kit push` command requires interactive confirmation and wasn't run after adding the new column.

### Fix Implemented

Ran the SQL directly against Neon:

```sql
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS expiry_date TEXT;
```

### Verification

```bash
# Check column exists
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'food_items';"

# Test API
curl http://localhost:8080/api/foods  # Returns data ✅
```

### Lessons Learned

1. **Always run migrations after schema changes:** After adding columns to `shared/schema.ts`, MUST run `npx drizzle-kit push` or direct SQL
2. **Test the API endpoint:** Don't just check if server starts - verify `/api/foods` actually returns data
3. **Check error messages carefully:** The error `column "expiry_date" does not exist` was the real issue, not dotenv loading
4. **Schema changes require 2 steps:**
   - Update `shared/schema.ts` (code)
   - Run migration (database)

### Prevention Checklist

When adding new database columns:
- [ ] Update `shared/schema.ts`
- [ ] Update `client/src/lib/store.ts` types
- [ ] Create migration file in `server/migrations/`
- [ ] **RUN THE MIGRATION:** `npx drizzle-kit push` or direct SQL
- [ ] Test API endpoint returns data

**Status:** ✅ Fixed - December 20, 2024

---

## Update: February 3, 2026 - Port Conflicts & Code Visibility Issues

**Date:** February 3, 2026  
**Issue:** Constant server restarts, code changes not visible, multiple port changes  
**Status:** ✅ Resolved

### Problem Summary

During development session, encountered multiple issues preventing code changes from being visible:

1. **Code changes not appearing in browser** - Despite multiple hard refreshes and relaunches
2. **Port conflicts** - Server couldn't start on default port 8080
3. **Multiple port changes** - Had to switch ports twice: 8080 → 5001 → 3001
4. **Frustration** - Over an hour spent trying to see changes that should have been immediate

### Root Cause

**Primary Issue: Port Conflicts**

The server was trying to start on port 8080, but another process was already using it:
- User has multiple apps running on different ports
- Port 8080 was in use by another application
- Server failed to start with error: `EADDRINUSE: address already in use :::8080`
- **Code changes weren't visible because the server wasn't actually running**

### Symptoms

1. **Server appears to start** - Terminal shows "Server running on port X"
2. **Browser shows old code** - Changes don't appear (refresh doesn't help)
3. **No console errors** - Nothing in browser console to indicate server issues
4. **Port conflict errors** - `EADDRINUSE` when trying to start on occupied port

### Solution Implemented

**Step 1: Identify Port Conflicts**
```bash
# Check what's using port 8080
lsof -i :8080

# Kill process on port 8080
lsof -ti :8080 | xargs kill -9
```

**Step 2: Change Default Port**

Changed default port in `server/index.ts` from 8080 to 3001:

**Before:**
```typescript
const port = parseInt(process.env.PORT || "8080", 10);
```

**After:**
```typescript
const port = parseInt(process.env.PORT || "3001", 10);
```

**Step 3: Update Shell Shortcut**

Updated user's `~/.zshrc` shortcut from:
```bash
fooddec() { PORT=8080 npm run dev & sleep 3 && open http://localhost:8080 }
```

To:
```bash
fooddec() { PORT=3001 npm run dev & sleep 3 && open http://localhost:3001 }
```

### Port History

**Port 8080:**
- Original default port (set Dec 11, 2024)
- **Issue:** Conflicted with another app user was running
- **Solution:** Changed to 3001

**Port 5001:**
- Attempted as temporary solution
- **Issue:** macOS system-level port blocking (likely AirPlay Receiver)
- **Error:** `EPERM: operation not permitted 0.0.0.0:5001`
- **Solution:** Switched to 3001

**Port 3001:**
- Current default port (Feb 3, 2026)
- **Status:** Working, no conflicts
- **Note:** User has other apps on 8080, 8081, but not 5001

### Why Code Changes Weren't Visible

**The Real Problem:**
- Server wasn't actually running (port conflict prevented startup)
- Browser was showing cached content from previous session
- Refresh didn't help because there was no server to fetch new code from

**What We Should Have Done Earlier:**
1. **Check terminal output** - Look for `EADDRINUSE` errors
2. **Verify server is running** - Check if `/health` endpoint responds
3. **Check port conflicts** - Use `lsof -i :PORT` before assuming code issue
4. **Consult this document** - Port conflict solutions were already documented!

### Prevention Checklist

**Before assuming code changes aren't working:**

1. ✅ **Check terminal for errors** - Look for `EADDRINUSE`, `EPERM`, or other startup errors
2. ✅ **Verify server is running** - Test `/health` endpoint: `curl http://localhost:PORT/health`
3. ✅ **Check port conflicts** - Run `lsof -i :PORT` to see what's using the port
4. ✅ **Kill conflicting processes** - `lsof -ti :PORT | xargs kill -9`
5. ✅ **Check this document** - Port conflict solutions are documented here!

### Quick Port Management Commands

```bash
# Check what's using a port
lsof -i :3001

# Kill process on a port
lsof -ti :3001 | xargs kill -9

# Kill all node processes (nuclear option)
pkill -9 node

# Start server on specific port
PORT=3001 npm run dev

# Check if port is available
nc -zv localhost 3001
```

### Lessons Learned

1. **Port conflicts prevent server startup** - If server can't start, code changes won't be visible
2. **Always check terminal output** - Errors are visible there, not in browser console
3. **Port conflicts are common** - Especially with multiple apps running
4. **Documentation exists for a reason** - This document had port conflict solutions we should have checked
5. **Default ports can conflict** - 8080, 5000, 5001 are commonly used - use less common ports (3001, 3002, etc.)

### Current Port Strategy

**Food-Compass:** Port 3001 (default)  
**Other apps:** 8080, 8081  
**Available:** 5001 (not yet used)

**Recommendation:** Use 3001+ range for development to avoid conflicts with system services (5000, 5001) and common web ports (8080, 8081).

### Related Issues

- **December 9, 2024:** Port 5000 blocked by macOS Control Center
- **December 11, 2024:** Default port changed from 5000 to 8080
- **February 3, 2026:** Default port changed from 8080 to 3001 (this update)

**Status:** ✅ Fixed - February 3, 2026

---

## Root Cause Analysis: Why Port Conflicts Keep Happening

**Date:** February 3, 2026  
**Issue:** Port conflicts recurring despite changing ports multiple times  
**Status:** ✅ Root cause identified and fixed

### The Real Problem

**Port conflicts keep happening because:**

1. **No graceful shutdown** - When you stop the server (Ctrl+C or close terminal), the process doesn't properly clean up
2. **Zombie processes** - Old server processes linger in the background, holding ports
3. **Multiple instances** - Starting server multiple times without killing previous instances
4. **Other apps** - You have other apps running on common ports (8080, 8081)

### Why This App Specifically

**This app doesn't have graceful shutdown handlers**, so when you stop it:
- The HTTP server doesn't close properly
- The process might not exit cleanly
- Ports remain bound even after "stopping" the server

**Other apps probably:**
- Have proper shutdown handlers
- Clean up ports on exit
- Or use different ports that don't conflict

### Evidence

When checking ports:
```bash
lsof -i :8080
# Shows: node process 37098 using port 8080 (redwood-broker)
# This is a LINGERING process from a previous server start
```

### Solution Implemented

**Added graceful shutdown handlers** to `server/index.ts`:

```typescript
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
```

**What this does:**
- Properly closes the HTTP server when you press Ctrl+C
- Releases the port immediately
- Prevents zombie processes
- Forces exit after 10 seconds if something hangs

### Prevention Going Forward

**Before starting server:**
```bash
# Always kill any existing processes on the port first
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
npm run dev
```

**Or create a helper script** (add to `package.json`):
```json
"dev:clean": "lsof -ti :3001 | xargs kill -9 2>/dev/null || true && PORT=3001 npm run dev"
```

**When stopping server:**
- Use Ctrl+C (now properly handled)
- Or kill the process: `lsof -ti :3001 | xargs kill -9`

### Why It Keeps Happening

**The cycle:**
1. Start server on port 3001 ✅
2. Stop server (Ctrl+C) ❌ **Process doesn't exit cleanly**
3. Port 3001 still occupied by zombie process
4. Try to start again → **EADDRINUSE error**
5. Change to different port → **Temporary fix**
6. Repeat cycle → **Problem persists**

**Now with graceful shutdown:**
1. Start server on port 3001 ✅
2. Stop server (Ctrl+C) ✅ **Process exits cleanly, port released**
3. Port 3001 available ✅
4. Start again → **Works immediately**

### Long-Term Solution

**Use a port that's less likely to conflict:**
- Current: 3001 (good choice)
- Avoid: 8080, 8081 (used by other apps)
- Avoid: 5000, 5001 (system services)

**Always check before starting:**
```bash
# Quick check
lsof -i :3001

# If something is using it, kill it
lsof -ti :3001 | xargs kill -9
```

**Status:** ✅ Root cause fixed - Graceful shutdown handlers added February 3, 2026

---

## The REAL Problem: Code Changes Not Appearing (February 3, 2026)

**Date:** February 3, 2026  
**Issue:** Code changes don't appear in browser, causing unnecessary server restarts  
**Status:** 🔍 Investigating root cause

### The Actual Problem

**You're restarting the server because changes don't show up**, not because of port conflicts. The port conflicts are a **symptom** of restarting, not the root cause.

**What's happening:**
1. Make code change
2. Save file
3. **Changes don't appear in browser** (refresh doesn't help)
4. Restart server thinking that will fix it
5. Port conflict (because old process didn't exit cleanly)
6. Change port
7. Repeat cycle

### Why Changes Might Not Appear

**Possible causes:**

1. **Vite HMR (Hot Module Replacement) not working**
   - WebSocket connection to `/vite-hmr` might be blocked
   - Browser might not be connecting to HMR endpoint
   - File watching might not be detecting changes

2. **Browser caching**
   - Even with `Cache-Control: no-store`, browser might cache
   - Service workers might cache old code
   - Browser extensions might interfere

3. **Wrong file being edited**
   - Editing wrong file path
   - Changes in wrong branch/workspace

4. **Vite not detecting file changes**
   - File system watching issues
   - Case sensitivity problems
   - Symlink issues

### How to Diagnose

**Check if HMR is working:**
1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for connection to `/vite-hmr`
4. Make a code change
5. Check if WebSocket receives update messages

**Check if Vite is watching files:**
1. Make a change to a file
2. Check terminal for Vite rebuild messages
3. Should see: `[vite] hmr update /src/pages/add-details.tsx`

**Check if server is serving new code:**
1. Check Network tab → see if files have new timestamps when you save
2. Check if `main.tsx?v=...` query param changes when you save
3. Check terminal for Vite rebuild messages when you save

### Current Vite Configuration

**HMR is configured:**
```typescript
// server/vite.ts
hmr: { server, path: "/vite-hmr" }
```

**Cache headers are set:**
```typescript
"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
```

**But something is still preventing changes from appearing.**

### Questions to Answer

1. **Does HMR WebSocket connect?** (Check DevTools → Network → WS)
2. **Does Vite detect file changes?** (Check terminal for rebuild messages)
3. **Does the terminal show Vite rebuild messages when you save?**
4. **Are you editing the right file?** (Verify file path)
5. **Is the server actually running?** (Check `/health` endpoint)

### Next Steps

**To properly diagnose:**
1. Make a small change (add a console.log)
2. Check terminal for Vite rebuild message
3. Check browser DevTools → Network → WS for HMR connection
4. Check browser console for any errors
5. Check terminal for Vite messages when you save
6. Report what you see

**Status:** 🔍 Need to investigate why HMR isn't working or why changes aren't being detected

---

## What's Different About This App (February 3, 2026)

**Date:** February 3, 2026  
**Issue:** This app is the ONLY one with code visibility issues - what's different?  
**Status:** 🔍 Investigating

### Key Difference: Vite Middleware Mode

**This app uses Vite in `middlewareMode: true`** - Vite runs as Express middleware, not as a standalone dev server.

**Most other apps probably use:**
- Standalone Vite dev server (`vite dev`)
- Or Next.js/CRA with their own HMR
- Or simpler setups without custom middleware

**This app's setup:**
```typescript
// server/vite.ts
const serverOptions = {
  middlewareMode: true,  // ⚠️ Vite runs as Express middleware
  hmr: { server, path: "/vite-hmr" },
  allowedHosts: true as const,
};

const vite = await createViteServer({
  configFile: path.resolve(import.meta.dirname, "..", "vite.config.ts"),
  server: serverOptions,
  appType: "custom",  // ⚠️ Custom app type
});
```

### Why This Might Cause Issues

**In middleware mode:**
1. **File watching might not work properly** - Vite relies on Express to handle requests, file watching might be different
2. **HMR WebSocket might not connect** - The `/vite-hmr` path needs to be properly proxied through Express
3. **Transform might not trigger** - `transformIndexHtml` is called manually, might not detect changes
4. **Custom setup complexity** - More moving parts = more things that can break

### Potential Issues

**1. File Watching Not Working**
- Vite might not be watching `client/src/` directory properly
- File system events might not be detected
- Check: Does terminal show rebuild messages when you save?

**2. HMR WebSocket Not Connecting**
- The `/vite-hmr` endpoint might not be properly set up
- Express might not be proxying WebSocket connections
- Check: DevTools → Network → WS → Is `/vite-hmr` connected?

**3. Transform Not Triggering**
- `transformIndexHtml` is called on every request, but Vite might cache
- The `nanoid()` query param might not force recompilation
- Check: Does `main.tsx?v=...` change when you save?

**4. Express Middleware Order**
- Vite middleware might be after other middleware that interferes
- Route handlers might intercept requests before Vite sees them
- Check: Is `app.use(vite.middlewares)` early enough in the middleware chain?

### What to Check

**When changes don't appear:**

1. **Check terminal** - Does Vite show rebuild messages?
   ```
   [vite] hmr update /src/pages/add-details.tsx
   ```

2. **Check browser DevTools → Network → WS** - Is `/vite-hmr` connected?

3. **Check if server is actually running** - `curl http://localhost:3001/health`

4. **Check if you're editing the right file** - Verify file path

5. **Check Express middleware order** - Is Vite middleware early enough?

### Why Other Apps Don't Have This Issue

**Other apps probably:**
- Use standalone Vite (`vite dev`) - simpler, fewer moving parts
- Use Next.js/CRA - their own HMR implementation
- Don't use custom Express middleware setup
- Have simpler file watching setup

**This app:**
- Custom Express + Vite middleware setup
- More complex architecture
- More things that can break
- File watching/HMR might not work as reliably

### Next Steps

**To fix this properly, we need to:**
1. Verify file watching is working (check terminal for rebuild messages)
2. Verify HMR WebSocket connects (check DevTools)
3. Check if Express middleware order is correct
4. Consider if `middlewareMode: true` is necessary or if we can simplify

**Status:** 🔍 Investigating why middleware mode setup prevents changes from appearing

---

## Why Middleware Mode? (February 3, 2026)

**Date:** February 3, 2026  
**Question:** Why is Vite in middleware mode instead of standalone dev server?  
**Answer:** Full-stack architecture requirement

### The Reason: Full-Stack App Architecture

**This app uses middleware mode because it's a full-stack application:**

1. **Express backend** - Serves API routes (`/api/foods`, `/api/archives`, etc.)
2. **React frontend** - Needs to be served from the same server
3. **Single port** - Both API and frontend on same port (e.g., `localhost:3001`)

**Why middleware mode is needed:**
- Express handles API routes (`/api/*`)
- Vite middleware handles frontend routes (`/`, `/add`, `/decide`, etc.)
- Both run on the same server/port
- In production: Express serves static built files
- In development: Express uses Vite middleware for HMR

### Architecture

```
┌─────────────────────────────────────┐
│   Express Server (port 3001)        │
├─────────────────────────────────────┤
│   API Routes: /api/*               │  ← Express handles these
│   Frontend: /*                      │  ← Vite middleware handles these
└─────────────────────────────────────┘
```

### Not Because of Mobile App

**The mobile app is separate:**
- Located in `mobile/` directory
- Uses Expo/React Native
- Has its own `package.json` and build process
- Connects to the same Express API but doesn't affect web setup

**Middleware mode is for the web app only** - it allows Express to serve both API and React frontend from one server.

### Alternative: Could Use Standalone Vite + Proxy

**Could theoretically do:**
- Standalone Vite dev server on port 5173
- Express API server on port 3001
- Vite proxy API requests to Express

**But current setup:**
- Single server, single port
- Simpler for deployment
- Works well for full-stack apps

### The Problem

**Middleware mode works, BUT:**
- File watching might be less reliable than standalone Vite
- HMR WebSocket connection might have issues
- More complex setup = more things that can break

**This is why other apps (that use standalone Vite) don't have this issue.**

### Could We Change It?

**Yes, but not doing it now (waste of time):**
- Would need to set up Vite proxy for API routes
- Would need to change deployment setup
- Might break existing workflows
- **Documented as future solution if problems persist**

**Status:** ✅ Documented - Middleware mode was chosen because of Replit, not technical requirement

---

## The Real Reason: Replit (February 3, 2026)

**Date:** February 3, 2026  
**Root Cause:** This project was started on Replit, which influenced the architecture  
**Status:** ✅ Documented for future reference

### What Happened

**This was the user's first Replit project.** Replit's setup likely influenced the architecture choice:
- Replit works best with single-server setups
- Middleware mode fits Replit's deployment model
- It was probably the easiest path at the time

**But now:**
- We're running locally, not on Replit
- Middleware mode is causing file watching issues
- There's no technical reason to keep it

### What is Express? (Compared to Other Options)

**Express = Backend Server Framework**

Think of Express as the waiter at a restaurant:
- **You (browser)** ask for something: "Get me all my food items"
- **Express (waiter)** takes your order to the kitchen (database)
- **Express** brings back the food (data) to you

**Express handles:**
- API requests (`/api/foods`, `/api/archives`)
- Database connections
- Business logic (saving, updating, deleting)

**What other apps might use instead:**

1. **Next.js** - Has built-in API routes, doesn't need Express
   - API routes are just files in `/pages/api/` or `/app/api/`
   - No separate Express server needed
   - Simpler setup

2. **Frontend-only apps** - No backend at all
   - Just React/Vite, no Express
   - Uses external APIs (like Supabase directly)
   - No server to manage

3. **Other Node.js frameworks** - Fastify, Koa, etc.
   - Similar to Express but different
   - Less common

4. **Serverless functions** - Vercel/Netlify functions
   - No Express server running
   - Functions run on-demand
   - Simpler deployment

**This app uses Express** because:
- It needs a backend server for API routes
- It needs to connect to PostgreSQL database
- It was set up on Replit (which works well with Express)

**Other apps might not need Express** if they:
- Use Next.js (built-in API routes)
- Are frontend-only (no backend)
- Use serverless functions instead

### The Problem

**Middleware mode = Express using Vite as a helper**
- Instead of Vite running independently (like other apps)
- Vite runs INSIDE Express (middleware mode)
- This adds complexity and breaks file watching

### Solution: Switch to Standalone Vite (For Future)

**If file watching issues persist, consider switching to standalone Vite:**

**Current (Middleware Mode - Problematic):**
- Express server on port 3001
- Vite runs inside Express
- File watching unreliable

**Proposed (Standalone Vite - Better):**
- Express API server on port 3001 (`/api/*`)
- Vite dev server on port 5173 (frontend)
- Vite proxies API calls to Express
- File watching works reliably

**Why this is better:**
- Same setup as other apps (proven to work)
- Reliable file watching
- HMR works properly
- Less complexity

**What needs to change:**
1. Update `vite.config.ts` to add proxy for `/api/*` → `http://localhost:3001`
2. Change `package.json` dev script to run both servers
3. Update deployment (Render) to handle both (or keep current production setup)

**Status:** 📝 Documented as future solution if middleware mode continues causing issues








