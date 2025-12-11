# Build Problems and Fixes - December 5, 2024

This document logs the build issues encountered when deploying to Render and their solutions.

**Date:** December 5, 2024 (Dec 5)

## Overview

After migrating from Replit to Render, the initial deployment attempts failed during the build phase. Two main issues were identified and resolved on Dec 5, 2024.

---

## Issue 1: Replit Vite Plugin Causing Build Failure

### Error
```
Deploy failed for c23de6e: Merge GitHub changes
Exited with status 1 while building your code.
```

### Root Cause
The `vite.config.ts` file was unconditionally importing and using `@replit/vite-plugin-runtime-error-modal`, which is a Replit-specific plugin. This plugin:
- Is not available or compatible on Render's build environment
- Was being imported at the top level, causing the build to fail immediately

### Code Location
`vite.config.ts` - Line 5:
```typescript
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
```

And used unconditionally on line 11:
```typescript
runtimeErrorOverlay(),
```

### Solution
Made all Replit plugins conditional:
- Only load in development mode (`NODE_ENV !== "production"`)
- Only when `REPL_ID` environment variable is set (indicating Replit environment)
- Wrapped in try/catch blocks so missing plugins don't break the build

### Changes Made
**File:** `vite.config.ts`

**Before:**
```typescript
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),  // ❌ Always loaded
    // ...
  ],
});
```

**After:**
```typescript
// Conditionally import Replit plugins only in development/Replit environment
const getReplitPlugins = async () => {
  const plugins = [];
  
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal");
      plugins.push(runtimeErrorOverlay.default());
    } catch (e) {
      // Plugin not available, skip it
    }
    // ... other Replit plugins
  }
  
  return plugins;
};

export default defineConfig(async () => ({
  plugins: [
    react(),
    ...(await getReplitPlugins()),  // ✅ Only loads in Replit dev
    // ...
  ],
}));
```

### Commit
- **Commit:** `c329dab` - "Fix: Make Replit Vite plugins optional for Render builds"
- **Date:** December 6, 2024

---

## Issue 2: Missing esbuild Package During Build

### Error
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'esbuild' 
imported from /opt/render/project/src/script/build.ts
```

### Root Cause
Build-time dependencies (`esbuild`, `vite`, `tsx`, `@vitejs/plugin-react`, `@tailwindcss/vite`) were in `devDependencies`. Render's build process may not install `devDependencies` during the build phase, causing the build script to fail when trying to import these packages.

### Code Location
`package.json` - Build dependencies were in `devDependencies`:
- `esbuild` - Required by `script/build.ts` to bundle the server
- `vite` - Required to build the client
- `tsx` - Required to run the TypeScript build script
- `@vitejs/plugin-react` - Required by Vite config
- `@tailwindcss/vite` - Required by Vite config

### Solution
Moved all build-time dependencies from `devDependencies` to `dependencies` so Render installs them during the build phase.

### Changes Made
**File:** `package.json`

**Moved to dependencies:**
- `esbuild`: `^0.25.0`
- `vite`: `^7.1.9`
- `tsx`: `^4.20.5`
- `@vitejs/plugin-react`: `^5.0.4`
- `@tailwindcss/vite`: `^4.1.14`

**Remained in devDependencies:**
- Type-only packages (`@types/*`)
- Development-only tools (`drizzle-kit`, `autoprefixer`, `postcss`, `tailwindcss`)
- Replit-specific plugins

### Commit
- **Commit:** `a81e879` - "Fix: Move build-time dependencies to dependencies for Render"
- **Date:** December 6, 2024

---

## Build Process

The build script (`script/build.ts`) performs two main tasks:

1. **Client Build** - Uses Vite to build the React frontend
2. **Server Build** - Uses esbuild to bundle the Express server

Both require their respective tools to be available during the build phase, which is why they must be in `dependencies` rather than `devDependencies`.

### Build Commands
- **Build:** `npm run build` → `npx tsx script/build.ts`
- **Start:** `npm start` → `NODE_ENV=production node dist/index.cjs`

---

## Lessons Learned

1. **Environment-Specific Code**: Code that's specific to one hosting environment (like Replit) should be conditionally loaded, not hardcoded.

2. **Build Dependencies**: Any package required during the build process (not just runtime) should be in `dependencies`, not `devDependencies`, especially for CI/CD environments that may skip devDependencies.

3. **Error Handling**: When conditionally loading optional plugins, always wrap in try/catch to gracefully handle missing packages.

---

## Verification

After both fixes:
- ✅ Build completes successfully locally
- ✅ Build completes successfully on Render
- ✅ Application deploys and runs on Render
- ✅ Replit plugins still work in Replit development environment

---

## Related Files

- `vite.config.ts` - Vite configuration with conditional Replit plugins
- `package.json` - Dependencies configuration
- `script/build.ts` - Build script that bundles client and server
- `server/index.ts` - Express server entry point

---

## Status

**Resolved** - All build issues fixed. Application successfully deploys to Render.

---

## Update: December 11, 2024 - Function Name Conflict

**Date:** December 11, 2024  
**Issue:** Build failed with "The symbol 'saveLocation' has already been declared"  
**Status:** ✅ Resolved

### Problem Identified

When importing a hook that exports a function with the same name as a local function, TypeScript/esbuild throws a duplicate declaration error.

**Error:**
```
ERROR: The symbol "saveLocation" has already been declared
file: /Users/shonac/Cursor/Food-Compass/client/src/pages/add-details.tsx:198:11
```

**Root Cause:**
- Imported `saveLocation` from `useSavedLocations()` hook
- Also had a local function named `saveLocation` in the same file
- Both functions existed in the same scope, causing conflict

### Solution

Rename the imported function using destructuring alias:

**Before (Broken):**
```typescript
const { saveLocation } = useSavedLocations();

function saveLocation(values: z.infer<typeof locationSchema>) {
  // Local function
}
```

**After (Fixed):**
```typescript
const { saveLocation: saveLocationToHistory } = useSavedLocations();

function saveLocation(values: z.infer<typeof locationSchema>) {
  // Local function - no conflict
  // Use saveLocationToHistory() when calling the hook function
}
```

### Lessons Learned

1. **Always rename imported functions if they conflict with local functions** - Use destructuring alias syntax
2. **Test build before deploying** - Build errors won't show in dev mode, only during production build
3. **Check for naming conflicts** - When adding new hooks/imports, check if function names conflict with existing code

### Related Files

- `client/src/pages/add-details.tsx` - Fixed function name conflict
- `client/src/hooks/use-saved-locations.ts` - Hook that exports `saveLocation`

**Status:** ✅ Resolved - Build now completes successfully

