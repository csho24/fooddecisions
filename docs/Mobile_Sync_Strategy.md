# Mobile Sync Strategy - How to Avoid Fixing Things Twice

**Problem:** Web and mobile are separate codebases. Fixes/features need to be implemented twice, tested twice, and bugs appear twice.

**Current State:**
- ✅ Shared: `shared/schema.ts` (database schema)
- ✅ Shared: API endpoints (same backend)
- ❌ Duplicated: Business logic (date formatting, location normalization, etc.)
- ❌ Duplicated: UI components (React vs React Native)

---

## Strategy 1: Share More Business Logic (RECOMMENDED)

**What to Share:**
1. **Utility functions** (`capitalizeWords`, `normalizeLocKey`, date formatting)
2. **Business logic** (categorization, location matching, closure date logic)
3. **Constants** (categories, colors, validation rules)
4. **Type definitions** (if not already shared)

**How:**
- Move shared logic to `shared/` folder
- Both web and mobile import from `shared/`
- Only UI components stay separate

**Example:**
```
shared/
  schema.ts          ✅ Already shared
  utils.ts           ➕ Add: capitalizeWords, normalizeLocKey, etc.
  constants.ts       ➕ Add: categories, colors, validation rules
  business-logic.ts  ➕ Add: categorizeFood, getClosureDisplayLocation, etc.
```

**Pros:**
- Fix bugs once, works everywhere
- Consistent behavior across platforms
- Less code duplication

**Cons:**
- Need to refactor existing code
- Some logic is UI-specific (can't share)

---

## Strategy 2: React Native Web (Long-term)

**What:** Use React Native for both web and mobile. Write once, run everywhere.

**How:**
- Rewrite web app using React Native components
- Use `react-native-web` to render on web
- Keep mobile app as-is (it's already React Native)

**Pros:**
- Single codebase
- No sync issues
- Your web is already mobile-styled, so this makes sense

**Cons:**
- **Major refactor** - would need to rewrite entire web app
- Different component library (no Radix UI)
- Learning curve

**When to Consider:**
- If you're planning a major rewrite anyway
- If mobile parity becomes a constant pain
- If you want to add more platforms (tablet, desktop)

---

## Strategy 3: Better Sync Process (Current + Improvements)

**What:** Keep separate codebases but improve the sync process.

**Current:**
- ✅ Detailed parity docs (Web_to_Mobile_Parity_Plan.md)
- ✅ Step-by-step instructions for fixes

**Add:**
1. **Sync Checklist Script** - Automatically compare web/mobile features
2. **Shared Test Cases** - Same tests for both platforms
3. **Code Generation** - Generate mobile components from web patterns

**Example Sync Checklist:**
```bash
# Script that checks:
- Does mobile have capitalizeWords? (check shared/utils.ts)
- Does mobile have getClosureDisplayLocation? (check AddInfoScreen.tsx)
- Are closure save handlers identical? (compare logic)
```

**Pros:**
- No major refactor needed
- Works with current setup
- Can implement incrementally

**Cons:**
- Still need to sync manually
- Documentation needs maintenance

---

## Strategy 4: Question if Mobile is Needed

**Reality Check:**
- Your web app is already mobile-styled (narrow layout, touch-friendly)
- Modern browsers work great on phones
- PWA (Progressive Web App) can be installed like a native app

**Consider:**
- Do users actually need a native app?
- Could web + PWA be enough?
- Is the native app providing value worth the maintenance cost?

**If Mobile is Needed:**
- Focus on core features only
- Accept that some features are web-only
- Don't try to match every detail

---

## Recommended Approach: Hybrid

**Phase 1: Share Business Logic (Now)**
1. Extract utilities to `shared/utils.ts`
2. Extract business logic to `shared/business-logic.ts`
3. Extract constants to `shared/constants.ts`
4. Update both web and mobile to import from shared

**Phase 2: Improve Sync Process (Next)**
1. Create sync checklist script
2. Update parity docs as you go
3. Use detailed instructions (like we just did)

**Phase 3: Evaluate (Future)**
- After 6 months, assess: Is mobile worth the maintenance?
- If yes, consider React Native Web
- If no, consider PWA-only approach

---

## Immediate Action Items

### 1. Extract Shared Utilities
```typescript
// shared/utils.ts
export function capitalizeWords(str: string): string { ... }
export function normalizeLocKey(str: string): string { ... }
export function formatDate(date: Date): string { ... }
```

### 2. Extract Business Logic
```typescript
// shared/business-logic.ts
export function categorizeFood(name: string): string { ... }
export function getClosureDisplayLocation(...): string { ... }
export function getCleaningLocationCountForDate(...): number { ... }
```

### 3. Extract Constants
```typescript
// shared/constants.ts
export const HOME_CATEGORIES = ["Fridge", "Snacks"];
export const CLEANING_COLOR = "#2563eb";
export const TIMEOFF_COLOR = "#f59e0b";
```

### 4. Update Both Platforms
- Web: `import { capitalizeWords } from "@/shared/utils"`
- Mobile: `import { capitalizeWords } from "../shared/utils"`

---

## Why Direct Copy-Paste Doesn't Work

**Fundamental Differences:**
- **Components:** `<div>` vs `<View>`, `<button>` vs `<TouchableOpacity>`
- **Styling:** CSS/Tailwind vs StyleSheet objects
- **Navigation:** `wouter` (web) vs React Navigation (mobile)
- **Forms:** `react-hook-form` (web) vs native inputs (mobile)

**What CAN Be Shared:**
- ✅ Business logic (calculations, transformations)
- ✅ Utility functions (string manipulation, date formatting)
- ✅ Constants (colors, categories, validation rules)
- ✅ Type definitions
- ✅ API client logic (already similar)

**What CANNOT Be Shared:**
- ❌ UI components (different primitives)
- ❌ Styling (CSS vs StyleSheet)
- ❌ Navigation (different libraries)
- ❌ Form handling (different approaches)

---

## Success Metrics

**After implementing shared logic:**
- [ ] Bug fixes apply to both platforms automatically
- [ ] New features only need UI implementation (not logic)
- [ ] Consistent behavior across platforms
- [ ] Less time spent on mobile sync

---

## Questions to Ask Yourself

1. **Do you need a native app?** Or would PWA work?
2. **How often do you add features?** More features = more sync pain
3. **How different are the UIs?** If very similar, React Native Web makes sense
4. **What's your timeline?** Quick wins (shared logic) vs long-term (RN Web)

---

**Bottom Line:** Start with sharing business logic. It's the quickest win and will immediately reduce duplication. Then evaluate if React Native Web makes sense for your use case.

---

## How to Use These Docs with AI

### For Syncing Features/Fixes:

**Use:** `Web_to_Mobile_Parity_Plan.md`

**How:**
1. Open the parity plan doc
2. Find the section with the fixes you want (e.g., "Section 0c - February 3 Calendar Fixes")
3. Tell AI: "Implement [Fix Name] from Web_to_Mobile_Parity_Plan.md section 0c"
4. Or: "Sync items 11-17 from the parity plan to mobile"

**Example prompts:**
- "Implement Fix 1 (Multi-Date Selection) from Web_to_Mobile_Parity_Plan.md section 0c"
- "Apply all February 3 calendar fixes (section 0c) to mobile"
- "Check Web_to_Mobile_Parity_Plan.md and sync any unchecked items to mobile"

### For Understanding Strategy:

**Use:** `Mobile_Sync_Strategy.md`

**When:** When you want to understand WHY things are duplicated, or explore long-term solutions.

**Example prompts:**
- "Read Mobile_Sync_Strategy.md and extract the shared utilities to shared/utils.ts"
- "Based on Mobile_Sync_Strategy.md, what should I share between web and mobile?"

### Best Practice:

**For immediate fixes:** Use `Web_to_Mobile_Parity_Plan.md` - it has step-by-step instructions.

**For long-term planning:** Use `Mobile_Sync_Strategy.md` - it explains the bigger picture.

**You can reference both:** "Read both docs, then implement Fix 1 from the parity plan using the shared logic approach from the strategy doc"
