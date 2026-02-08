# Localhost Development Server Fix - December 9, 2024

**fooddec:** port 5173.

## Add page file path and verifying which bundle is loaded (Feb 2025)

**The only page that renders at `http://localhost:5173/add` is:**
- **File:** `client/src/pages/add-details.tsx`  
- **Full path:** `Food-Compass/client/src/pages/add-details.tsx` (from repo root)

To confirm the browser is running the **current** code (no instruction under Cleaning Days location input):
1. Go to `http://localhost:5173/add` → Cleaning Days → select one day so the location input appears.
2. Use **Find in Page** (Cmd+F / Ctrl+F) and search for: **`ADD_DETAILS_NO_INSTR`**
3. If that string is found → the new bundle is loaded (instruction is removed in this build).
4. If it is **not** found → the browser is still using an old cached bundle; try hard refresh (Cmd+Shift+R), or open the URL in an Incognito/Private window, or clear site data for localhost:8080.

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








