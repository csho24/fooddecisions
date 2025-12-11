# Expo Go - Reliable Startup Guide

## Quick Start (Most Reliable)

```bash
cd mobile
npm run start:fresh
```

This clears all caches and starts Expo with a clean slate.

## If App Won't Load

### Step 1: Clear All Caches
```bash
cd mobile
rm -rf .expo node_modules/.cache
npm run start:clean
```

### Step 2: On Your Phone
- **Android:** Settings → Apps → Expo Go → Storage → Clear Cache
- **iOS:** Delete and reinstall Expo Go app

### Step 3: Verify app.config.js
**CRITICAL:** Make sure `app.config.js` does NOT have an `updates` section. If you see:
```javascript
updates: {
  enabled: false  // ❌ REMOVE THIS ENTIRE SECTION
}
```
Delete it immediately. See the comment at the top of `app.config.js` for why.

### Step 4: Restart Everything
1. Stop Expo server (Ctrl+C)
2. Close Expo Go on your phone
3. Run `npm run start:fresh` again
4. Scan QR code with Expo Go

## Common Issues

### "Failed to download remote update"
- **Cause:** `updates` config exists in `app.config.js`
- **Fix:** Remove the `updates` section completely

### App stuck on splash screen
- **Cause:** Cached config or bundle
- **Fix:** Run `npm run start:fresh` and clear Expo Go cache

### "Unable to resolve module"
- **Cause:** Package version mismatch or missing dependencies
- **Fix:** Run `npx expo install --fix` in the mobile directory

## Available Scripts

- `npm start` - Normal start (may have cached issues)
- `npm run start:clean` - Start with cleared Metro cache
- `npm run start:fresh` - **BEST** - Clear all caches and start fresh

## Why This Matters

Expo Go loads directly from your dev server. It doesn't need or want OTA updates. Having update configs causes it to try checking for remote updates, which fails and breaks the app.









