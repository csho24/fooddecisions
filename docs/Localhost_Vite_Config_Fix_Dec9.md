# Localhost Development Server Fix - December 9, 2024

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
