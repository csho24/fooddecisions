# Web-to-Mobile Parity Plan

**Purpose:** Bring the mobile app in line with recent web changes. Web is the primary test surface; changes should be transferred to mobile so both behave the same.

**Last updated:** Feb 3, 2026

**Note:** Some business logic functions are now shared in `shared/` folder:
- ✅ `shared/utils.ts` - capitalizeWords, normalizeLocKey
- ✅ `shared/business-logic.ts` - categorizeFood, getClosureDisplayLocation
Both web and mobile import from these shared files, reducing duplication.

**Verification:** Plan items are checked against **current web code** (client/src) so we don’t ask mobile to “fix” something web doesn’t do or overwrite with old doc behavior. Where web and mobile already match, the plan says “Parity: matched” and no change is requested.

---

## 0. Changes made on web this session (today / past few hours)

Everything we changed on web in this chat is listed below with **Applied to mobile?** so nothing is assumed.

| # | Web change (what we did) | Applied to mobile? | Remaining action (if any) |
|---|---------------------------|--------------------|---------------------------|
| 1 | **Delete closures:** DELETE API, delete button on each row (upcoming + past), past closures section with delete | ✅ Yes | None. |
| 2 | **Past closures:** Only show upcoming in “Scheduled Closures”; past in separate “Past closures” section (with delete) | ✅ Yes | None. |
| 3 | **Full location name:** Save/display full location (e.g. GIMO) not search query (e.g. GH); getClosureDisplayLocation | ✅ Yes | None. |
| 4 | **Calendar day tooltip:** Hover a date with a closure → native tooltip shows “Location › Food • Cleaning/Time off” | ❌ No | Optional: long-press on day with closure → show same text (Alert or modal). |
| 5 | **Cleaning = mass-select:** No “Which stall?”; type location → all stalls at that location; “Mark all X stalls closed” button | ✅ Yes | None. |
| 6 | **Remove middle banner (cleaning):** No summary box above button; only instruction + button | ✅ Yes | None. |
| 7 | **Button text:** “Mark all X stalls closed” (no “Save —”), capital M | ✅ Yes | None. |
| 8 | **Colors:** Cleaning = blue, time off = amber (list rows, calendar modifiers, home banner lines) | ⚠️ Partial | Add Info: ✅. **Home banner: ❌** – mobile still all amber; add blue for cleaning lines in `HomeScreen.tsx`. |
| 9 | **Location input (closure):** Focus ring inset so edges don’t clip; `px-1` wrapper; label aligned with input | N/A (web only) | Low: if mobile location input feels misaligned, add matching horizontal padding. |
| 10 | **Decide – hide header back:** When drilled into Go Out → Food (category) or Go Out → Location (location), hide header back; only “Back to Categories” / “Back to Locations” | ❌ No | Mobile Decide doesn’t have Location/Food drill yet; when you add it (section 2.3), also hide header back when drilled in. |
| 11 | **Calendar multi-date selection:** Can select multiple dates (including saved dates) - orange border persists on all selected dates | ❌ No | **CRITICAL:** See section 0c below for detailed steps. |
| 12 | **Calendar dark blue logic:** Dark blue only for 2+ distinct locations (not 2+ stalls) | ❌ No | **CRITICAL:** See section 0c below for detailed steps. |
| 13 | **Location capitalization normalization:** Prevent duplicates like "Margaret Drive" vs "Margaret drive" | ❌ No | **CRITICAL:** See section 0c below for detailed steps. |
| 14 | **Past closures removed:** Removed "Past closures" sections from UI (past dates still visible on calendar) | ⚠️ Partial | Mobile still has "Past closures" section - remove it to match web. |
| 15 | **Past dates selectable in Time Off:** Past dates no longer disabled in Time Off calendar | ❌ No | Mobile still disables past dates () - remove this restriction. |
| 16 | **Selected dates banner:** Shows "2 days — 9 Feb, 10 Feb" under calendar when dates selected | ❌ No | Add banner showing selected dates count and list. |
| 17 | **getClosureDisplayLocation exact match:** Uses exact match (case-insensitive) instead of includes() to prevent wrong location display | ❌ No | **CRITICAL:** See section 0c below for detailed steps. |

**Summary:** Items 1–3, 5–7 are done on mobile. Item 4 (tooltip) and 9 (input alignment) are optional/low. Item 8 – **Home closure banner colors** still needs to be done on mobile. Item 10 – **Decide** (tabs + drill + hide back) is the big parity piece not yet on mobile. **Items 11–17 are February 3, 2026 calendar fixes that need to be replicated on mobile.**

---

## 0c. February 3, 2026 Calendar Fixes - DETAILED Mobile Replication Steps

**Date:** February 3, 2026  
**Status:** ❌ Not applied to mobile  
**Reference:** `docs/Calendar Problems and Fixes.md` (February 3, 2026 section)

**⚠️ IMPORTANT:** These fixes are CRITICAL. Do NOT just say "copy web version" - follow these exact steps. The user has tried "copy web version" before and AI cannot properly duplicate it. Use these SPECIFIC instructions.

### Fix 1: Multi-Date Selection (Cannot Select Multiple Dates)

**Problem:** Mobile can only select one date at a time. Clicking a second date deselects the first.

**Current Mobile Code Location:** `mobile/src/screens/AddInfoScreen.tsx` lines ~157-173 (`toggleDateSelection` function)

**What's Wrong:**
```typescript
if (isDateSaved(date, type)) return; // ❌ WRONG - prevents selecting saved dates
```

**What to Change:**
1. **Remove the check that prevents selecting saved dates:** Delete or comment out `if (isDateSaved(date, type)) return;`
2. **Verify multiple dates accumulate:** The `setSelectedDates([...selectedDates, date])` should work, but ensure dates are deduplicated by timestamp
3. **Add visual feedback:** Add orange border/ring style for selected dates (match web's orange ring around selected dates)

**Web Reference:** `client/src/pages/add-details.tsx` lines 679-689 (onSelect handler), 733-734 (isInSelected check), 729 (orange ring className)

**Exact Mobile Changes:**
- Line ~162: Remove `if (isDateSaved(date, type)) return;`
- Line ~171: Ensure `setSelectedDates([...selectedDates, date])` deduplicates by timestamp
- Line ~891: Add selected style (orange border/ring) when `isSelected` is true

---

### Fix 2: Data Corruption Prevention (Saving for Wrong Dates)

**Problem:** When saving, mobile might save for dates that already have this location saved, creating duplicates.

**Current Mobile Code Location:** `mobile/src/screens/AddInfoScreen.tsx` lines ~775-793 (handleSave for cleaning)

**What to Add:**
1. **Before saving, filter out dates that already have this location:**
   ```typescript
   const existingDates = new Set(
     savedClosures
       .filter(c => c.type === 'cleaning' && normalizeLocKey(getClosureDisplayLocation(c)) === normalizeLocKey(fullLocation))
       .map(c => c.date)
   );
   const newDates = selectedDates.filter(d => {
     const dateStr = formatDate(d); // YYYY-MM-DD
     return !existingDates.has(dateStr);
   });
   ```

2. **Only save `newDates`, not all `selectedDates`**
3. **Show toast with date range:** "Saved! Clementi — 9 stalls closed for cleaning on 23–24 Mar"

**Web Reference:** `client/src/pages/add-details.tsx` lines 899-910 (filter existing dates), 939-949 (date range formatting)

**Exact Mobile Changes:**
- Before line ~775: Add filtering logic to exclude dates that already have this location
- Use `newDates` instead of `selectedDates` in the save loop
- Update Alert message to show date range (e.g., "23–24 Mar" for multiple dates)

---

### Fix 3: Dark Blue Logic (Count Distinct Locations, Not Stalls)

**Problem:** Dark blue should only show when 2+ **different locations** are cleaning that day, not when one location has multiple stalls.

**Current Mobile:** Check if mobile has dark blue logic. If not, add it.

**What to Add:**
1. **Add helper function to count distinct locations:**
   ```typescript
   const getCleaningLocationCountForDate = (date: Date): number => {
     const year = date.getFullYear();
     const month = String(date.getMonth() + 1).padStart(2, '0');
     const day = String(date.getDate()).padStart(2, '0');
     const dateStr = `${year}-${month}-${day}`;
     const locs = new Set(
       savedClosures
         .filter(c => c.type === 'cleaning' && c.date === dateStr)
         .map(c => {
           const loc = getClosureDisplayLocation(c);
           return loc.trim().toLowerCase(); // Normalize for comparison
         })
     );
     return locs.size; // Number of distinct locations
   };
   ```

2. **Apply darker blue style when `getCleaningLocationCountForDate(date) >= 2`**
3. **Add darker blue style:** Create `dayCellCleaningDark` style (darker blue, e.g., `#1e40af`)

**Web Reference:** `client/src/pages/add-details.tsx` lines 134-153 (getCleaningLocationCountForDate), 721 (shouldBeDarkBlue), 727 (darker blue className)

**Exact Mobile Changes:**
- Add `getCleaningLocationCountForDate` function (around line ~100, near other helper functions)
- In calendar day rendering (line ~882): Check `getCleaningLocationCountForDate(date) >= 2` and apply darker blue style
- Add `dayCellCleaningDark` style to StyleSheet (darker blue background)

---

### Fix 4: Location Capitalization Normalization

**Problem:** Locations with different capitalization (e.g., "Margaret Drive" vs "Margaret drive") create duplicates.

**What to Add:**
1. **Add `capitalizeWords` utility function** (or import if shared utils exist):
   ```typescript
   const capitalizeWords = (str: string): string => {
     return str
       .split(' ')
       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
       .join(' ');
   };
   ```

2. **Normalize when saving:** Always capitalize before saving location
3. **Normalize in `getClosureDisplayLocation`:** Always return capitalized location
4. **Normalize in tooltip grouping** (if tooltips exist): Group by normalized key, display capitalized version

**Web Reference:** 
- `client/src/lib/utils.ts` (capitalizeWords function)
- `client/src/pages/add-details.tsx` line 854 (capitalizeWords when setting fullLocation)
- `client/src/pages/add-details.tsx` lines 177-201 (getClosureDisplayLocation always capitalizes)

**Exact Mobile Changes:**
- Add `capitalizeWords` function (or import from shared utils)
- Line ~797 (timeoff): `const fullLocation = capitalizeWords(...);`
- Line ~776 (cleaning): `const fullLocation = capitalizeWords(...);`
- Update `getClosureDisplayLocation` to always capitalize returned location

---

### Fix 5: getClosureDisplayLocation Exact Match

**Problem:** When a food item has multiple locations (e.g., Gimo and Clementi), it might show the wrong location.

**Current Mobile Code Location:** Find `getClosureDisplayLocation` function in `AddInfoScreen.tsx`

**What to Change:**
1. **Try exact match first** (case-insensitive): `loc.name.trim().toLowerCase() === savedLoc.toLowerCase()`
2. **Then try partial match** (for legacy data): `loc.name.toLowerCase().includes(savedLoc) || savedLoc.includes(loc.name.toLowerCase())`
3. **Always capitalize result:** `return capitalizeWords(matchedLocation.name);`

**Web Reference:** `client/src/pages/add-details.tsx` lines 177-201

**Exact Mobile Changes:**
- Update `getClosureDisplayLocation` function
- First try: exact match (case-insensitive)
- Second try: partial match (for legacy)
- Always: capitalize the result before returning

---

### Fix 6: Remove Past Closures Section

**Problem:** Mobile still shows "Past closures" section, web removed it.

**Current Mobile Code Location:** `mobile/src/screens/AddInfoScreen.tsx` lines ~940-970

**What to Remove:**
- Find the View with "Past closures" title (around line 943)
- Remove the entire View block that contains the past closures list
- Keep past dates visible on calendar (they should still show blue/amber on calendar)

**Web Reference:** Web removed lines 776-810 and 1209-1249 (Past closures Collapsible sections)

**Exact Mobile Changes:**
- Delete lines ~940-970 (the entire "Past closures" View section)
- Past dates remain visible on calendar grid (no change needed there)

---

### Fix 7: Make Past Dates Selectable in Time Off

**Problem:** Mobile disables past dates in Time Off calendar (`isPast && styles.dayCellDisabled`).

**Current Mobile Code Location:** `mobile/src/screens/AddInfoScreen.tsx` lines ~870, ~886, ~884

**What to Change:**
1. **Line ~870:** Change `const isPast = closureType === 'timeoff' && date < today;` to `const isPast = false;` (or remove `isPast` entirely)
2. **Line ~886:** Remove `!isPast &&` from `onPress` condition: `onPress={() => toggleDateSelection(date, closureType)}`
3. **Line ~884:** Remove `isPast && styles.dayCellDisabled` from style array

**Web Reference:** `client/src/pages/add-details.tsx` line 1127 (disabled only checks `isDateSaved(date, 'cleaning')`, not `date < today`)

**Exact Mobile Changes:**
- Line ~870: Remove or set `isPast = false` for timeoff
- Line ~886: Remove `!isPast &&` condition
- Line ~884: Remove `isPast && styles.dayCellDisabled` from styles array

---

### Fix 8: Selected Dates Banner

**Problem:** Mobile doesn't show which dates are selected before saving.

**What to Add:**
1. **Show banner when `selectedDates.length > 0`**
2. **Format:** "2 days — 9 Feb, 10 Feb" (or "1 day — 9 Feb")
3. **Placement:** After calendar grid, before location input section (around line ~978)
4. **Styling:** Simple text, no background/border (match web's muted text style)

**Web Reference:** `client/src/pages/add-details.tsx` lines 805-812

**Exact Mobile Changes:**
- After calendar grid (around line ~901), before location section (line ~978)
- Add View with Text showing: `{selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''} — {formatted dates}`
- Format dates: "9 Feb, 10 Feb" (use month abbreviations: Jan, Feb, Mar, etc.)
- Style: Simple text, muted color, no background

---

### Summary Checklist for Mobile

- [ ] **Fix 1:** Multi-date selection - Remove `isDateSaved(date, type)` check, ensure multiple dates accumulate, add orange border style
- [ ] **Fix 2:** Filter duplicates before saving - Check existing dates for this location, only save new dates, show date range in toast
- [ ] **Fix 3:** Dark blue logic - Add `getCleaningLocationCountForDate`, apply darker blue when >= 2 locations
- [ ] **Fix 4:** Location normalization - Add `capitalizeWords`, normalize when saving and displaying
- [ ] **Fix 5:** getClosureDisplayLocation exact match - Try exact match first, then partial, always capitalize
- [ ] **Fix 6:** Remove Past closures section - Delete the View block showing past closures list
- [ ] **Fix 7:** Make past dates selectable - Remove `isPast` restriction for timeoff type
- [ ] **Fix 8:** Selected dates banner - Add banner showing "X days — dates" after calendar

**Reference Files:**
- Web calendar logic: `client/src/pages/add-details.tsx` lines 655-750 (Cleaning calendar), 1110-1167 (Time Off calendar)
- Web location normalization: `client/src/pages/add-details.tsx` lines 177-201, 854, 899-930
- Calendar Problems doc: `docs/Calendar Problems and Fixes.md` (February 3, 2026 section)

---

## 0b. Documented fixes (Jan 14, Dec 19, Dec 23) – applied to mobile?

Checked **Problems and Fixes.md**, **Project Architecture.md** (Last Updated **January 14, 2026**), and **Dec 19 / Dec 23** entries. For each documented fix, whether it was applied to mobile is below.

**Current web verification:** All notes below were re-checked against the **current** web code (client/src) so we don’t ask mobile to “fix” something web doesn’t do. Where web and mobile already match, the plan says “Parity: matched” and does not ask for a mobile-only change.

### From Problems and Fixes – January 14 (Closure calendar)

| Doc fix | Current web | Mobile | Parity / action |
|---------|-------------|--------|------------------|
| Date timezone (closure: local date, no `toISOString`) | ✅ add-details closure save uses `getFullYear`/`getMonth`/`getDate` | ✅ Same | Parity: matched. |
| Fetch saved closures on load, refetch after save | ✅ | ✅ AddInfoScreen same | Parity: matched. |
| Saved dates not deselectable (filter in onSelect) | ✅ | ✅ toggleDateSelection checks isDateSaved | Parity: matched. |
| Cleaning/Time Off calendars synced (both types on calendar) | ✅ | ✅ dayCellCleaning / dayCellTimeoff | Parity: matched. |
| Food item association (food_item_id, food_item_name) | ✅ | ✅ handleSave sends foodItemId, foodItemName | Parity: matched. |
| **Expiry date save** | **Web currently:** `add-details.tsx` line 1086 uses `new Date(year, month, day).toISOString().split('T')[0]` | Mobile line ~1225: same `toISOString().split('T')[0]` | **Parity: matched.** Both use toISOString; doc only fixed *closure* dates. Optional improvement (do on **both** web and mobile if you want to avoid timezone shift for expiry): use local date string instead of toISOString. |

### From Project Architecture – January 14, 2026

| Doc item | Mobile applied? | Notes |
|----------|-----------------|--------|
| Closure list "Location › Food" format | ✅ Yes | getClosureDisplayLocation + foodItemName. |
| Avoid repetitive titles (no header title for cleaning/timeoff) | N/A | Mobile uses its own header; no duplicate title issue reported. |
| Food item columns in closures (DB) | ✅ Yes | API sends food_item_id, food_item_name. |

### From Problems and Fixes – December 19, 2024

| Doc fix | Current web | Mobile | Parity / action |
|---------|-------------|--------|------------------|
| **Saved locations** | **Web:** `useSavedLocations` in **list.tsx** – `getFilteredLocations` for quick-add location suggestions; `saveLocation` when adding Out item. **add-details:** only `saveLocationToHistory` when saving a location (line 347); no autocomplete in add-details. | No hook; no history; no suggestions. | **Parity:** Add hook (e.g. AsyncStorage). Call save when saving a location in AddInfoScreen (match add-details). If mobile list/FoodListsScreen has location input for Out items, add suggestions via getFilteredLocations like list.tsx. |
| **capitalizeWords** | **Web:** add-details: location name on save (325), closure location onBlur (637, 830), item name (261), location form name (1327). list.tsx: quick-add name and location on blur (182, 185, 304, 362). `client/src/lib/utils.ts` has `capitalizeWords(str)`. | No capitalizeWords; no auto-capitalize. | **Parity:** Add `capitalizeWords` (or equivalent) in mobile utils. Use on blur/save for: location name when saving, closure location input onBlur, item name where applicable – match current web usage. |
| Location history persisting | list + add-details use hook | No (same as above) | Covered by saved locations row. |
| Test data delete (Food Wasted) | food-wasted.tsx | No Food Wasted screen | N/A until mobile has that screen. |

### From Problems and Fixes – December 23, 2024 (Category)

| Doc fix | Web | Mobile applied? | Notes |
|---------|-----|-----------------|--------|
| Category save to DB (handleSelectCategory → updateItem) | ✅ add-details | ✅ Yes | AddInfoScreen handleSelectCategory calls updateItem. |
| Decide uses saved category (item.category with fallback) | ✅ decide.tsx itemsByFoodCategory | ⚠️ Partial | Mobile Decide groups **Home** by `item.category \|\| 'Other'` ✅. Mobile has no **Go Out → Food** (categories) flow, so “saved category for Out” not applicable until Decide parity. |

### From Health_Endpoint_503_Fixes – January 19–20, 2026

| Doc item | Mobile applied? | Notes |
|----------|-----------------|--------|
| Cron interval / health endpoint | N/A | Server-side only; no mobile client change. |

---

**Summary of doc-check – aligned with current web:**

1. **Expiry date** – Web and mobile **both** use `toISOString().split('T')[0]` for expiry save (web add-details 1086, mobile AddInfoScreen ~1225). No mobile-only “fix”; optional improvement for **both** is to use local date string if you want to avoid timezone shift.
2. **Saved locations** – Web: list.tsx has autocomplete; add-details only saves to history on location save. Mobile: add hook + save on location save + list suggestions if list has location input.
3. **capitalizeWords** – Web uses it in add-details (location save, closure location onBlur, item/location form) and list (quick-add name/location on blur). Mobile: add same behavior so we don’t overwrite web with old behavior.
4. **Home closure banner colors** – Web **currently** (home.tsx 77–81): cleaning = blue text, time off = amber. Mobile: still all amber. Action: match current web (blue for cleaning, amber for time off).
5. **Decide parity** – Already in plan (Location/Food tabs, drill, hide header back); match current decide.tsx.

---

## 1. Summary of Recent Web Changes (to mirror on mobile)

From recent work on the web client:

- **Closure system:** Delete closures (API + UI), tooltips on calendar day hover, past closures section, upcoming-only in “Scheduled Closures”, full location name in display (not search query).
- **Cleaning days:** Mass-select by location (no “Which stall?”); one location = whole hawker centre; “Mark all X stalls closed” button; no middle summary banner.
- **Time off:** Unchanged (single stall picker).
- **Colors:** Cleaning = blue, time off = amber (list rows, calendar, home banner).
- **Location input (closure):** Focus ring inset, label/input alignment (`px-1` on parent).
- **Decide:** Hide header back when drilled into Go Out → Food (category) or Go Out → Location (location detail); only in-page “Back to Categories” / “Back to Locations”.

---

## 2. Screen-by-Screen Comparison & Gaps

### 2.1 Home (home.tsx vs HomeScreen.tsx)

| Feature | Web | Mobile | Action |
|--------|-----|--------|--------|
| Closure banner | ✅ | ✅ | — |
| Closure line color by type | ✅ Cleaning = blue, Time off = amber | ❌ All amber (#B45309 / #D97706) | **Add:** Style each closure line by `c.type`: cleaning → blue text/type, time off → amber. |

**Files:** `mobile/src/screens/HomeScreen.tsx`  
**Change:** In the closure banner map, use two text styles (e.g. `closureBannerTextCleaning` / `closureBannerTextTimeoff`) based on `c.type === 'cleaning'` and apply blue vs amber colors to match web.

---

### 2.2 Add Info / Closure (add-details.tsx vs AddInfoScreen.tsx)

| Feature | Web | Mobile | Action |
|--------|-----|--------|--------|
| Delete closure (API + UI) | ✅ | ✅ | Done. |
| Upcoming vs past closures | ✅ Upcoming only in list; past in collapsible | ✅ Same | Done. |
| Full location name in list | ✅ getClosureDisplayLocation | ✅ Same | Done. |
| Cleaning = mass-select by location | ✅ No stall picker; “Mark all X stalls closed” | ✅ Same | Done. |
| Time off = single stall | ✅ | ✅ | Done. |
| No middle summary banner (cleaning) | ✅ | ✅ | Done. |
| Blue (cleaning) / amber (time off) | ✅ List + calendar | ✅ List + calendar (dayCellCleaning/Timeoff, closureItemCleaning/Timeoff) | Done. |
| Calendar day tooltip (closure info) | ✅ Native `title` on hover | ❌ No hover on mobile | **Optional:** Long-press on a day with closure → show Alert or small modal with same tooltip text (location › food • type). |
| Location input focus/alignment | ✅ `px-1` wrapper, ring-inset, label aligned | N/A (different focus UX) | **Low:** If mobile location input feels misaligned vs “Scheduled Closures” block, add matching horizontal padding. |

**Files:** `mobile/src/screens/AddInfoScreen.tsx`  
**Optional:** Implement long-press tooltip for closure days if you want parity of “see what this day was” on mobile.

---

### 2.3 Decide (decide.tsx vs DecideScreen.tsx)

| Feature | Web | Mobile | Action |
|--------|-----|--------|--------|
| Type choice (Home / Go Out) | ✅ | ✅ | — |
| Search | ✅ | ✅ | — |
| Go Out: Location vs Food tabs | ✅ Two tabs, then drill | ❌ Single SectionList by location | **Major:** Add `outTab`: 'location' \| 'food'. |
| Go Out → Location: list → pick location → list foods at location | ✅ | ❌ | **Major:** Implement location drill: locations list → `selectedLocation` → list items at that location; “Back to Locations”. |
| Go Out → Food: categories → pick category (e.g. Noodles) → list foods in category | ✅ | ❌ | **Major:** Implement food category drill: categories list → `selectedFoodCategory` → list items in category; “Back to Categories”. |
| Hide header back when drilled in | ✅ When `selectedFoodCategory` or `selectedLocation` set | N/A until drill exists | **With 2.3:** When drilled into location or food category, hide header back; only show in-page “Back to Locations” / “Back to Categories”. |

**Files:** `mobile/src/screens/DecideScreen.tsx`  
**Scope:** Decide parity is the largest change. It implies:  
1. Add state: `outTab`, `selectedLocation`, `selectedFoodCategory`, `selectedFoodFromLocation`, `selectedFoodFromCategory` (and any item-detail state if web has it).  
2. When `selectedType === 'out'`: show Location / Food tab buttons.  
3. **Location tab:** List unique locations → on select, list foods at that location (and optional food-detail view).  
4. **Food tab:** List food categories (Noodles, Rice, etc.) → on select, list foods in that category.  
5. Use same grouping/categorization as web (`itemsByFoodCategory`, `uniqueLocations`, etc.).  
6. Add “Back to Locations” / “Back to Categories” buttons and hide header back when `selectedLocation !== null` or `selectedFoodCategory !== null`.

Reference: `client/src/pages/decide.tsx` (structure, `groupedItems`, `itemsByFoodCategory`, `uniqueLocations`, `outTab`, drill UI).

---

### 2.4 List / Food List (list.tsx vs FoodListsScreen.tsx)

| Feature | Web | Mobile | Action |
|--------|-----|--------|--------|
| Home / Out tabs | ✅ | ✅ | — |
| Add item | ✅ | ✅ | — |
| Archive (eaten/thrown) | ✅ | ✅ | — |
| Quick add with location (Out) | ✅ | ❓ | **Check:** Does mobile support location when adding Out item? |
| Saved locations / autocomplete | ✅ useSavedLocations | ❓ | **Check:** Mobile has no `useSavedLocations`; add if list add-flow uses location input. |
| Archive stats (eaten, thrown) | ✅ | ❓ | **Check:** Web has stats; ensure mobile shows equivalent if desired. |
| Checkmark visibility (list item layout) | ✅ Fixed per List_Page_Checkmark_Visibility_Fix | ❓ | **Check:** Ensure mobile list row doesn’t clip action/checkmark; add shrink-0 if needed. |
| Deep link / filter from URL | ✅ | N/A (mobile uses route params) | — |

**Files:** `mobile/src/screens/FoodListsScreen.tsx`  
**Action:** Audit add-item flow (especially for Out: location required, suggestions) and archive/stats UI; align with web where applicable. No single “recent web change” block here; treat as incremental parity.

---

### 2.5 Food Wasted (food-wasted.tsx)

| Feature | Web | Mobile | Action |
|--------|-----|--------|--------|
| Food Wasted page | ✅ Dedicated route | ❌ No screen | **Optional:** Add `FoodWastedScreen` and route in mobile app if you want the same “wasted” history/stats as web. |

**Files:** New `mobile/src/screens/FoodWastedScreen.tsx`, register in `mobile/App.tsx`.  
**Reference:** `client/src/pages/food-wasted.tsx`.

---

## 3. Recommended Order of Work

1. **Quick win – Home closure banner colors**  
   - Update `HomeScreen.tsx` so closure lines use blue for cleaning and amber for time off.  
   - Small, self-contained change.

2. **Decide parity (largest)**  
   - Add Location/Food tabs and drill-down on mobile Decide.  
   - Implement “Back to Locations” / “Back to Categories” and hide header back when drilled in.  
   - Use this plan and `decide.tsx` as reference; can be split across multiple sessions.

3. **Add Info optional polish**  
   - Long-press tooltip for closure calendar days.  
   - Any location input alignment tweak to match “Scheduled Closures” width.

4. **List page audit**  
   - Compare add-item (especially Out + location), archive, and stats with web; apply parity fixes as needed.

5. **Food Wasted (optional)**  
   - Add mobile screen and navigation if you want full feature parity with web.

---

## 4. References

- **Closure / cleaning / time off (web):** `client/src/pages/add-details.tsx`, `client/src/lib/api.ts` (closures + delete).  
- **Closure (mobile):** `mobile/src/screens/AddInfoScreen.tsx`, `mobile/src/api.ts`.  
- **Decide (web):** `client/src/pages/decide.tsx` (tabs, drill, hideHeaderBack).  
- **Decide (mobile):** `mobile/src/screens/DecideScreen.tsx`.  
- **Home closure banner (web):** `client/src/pages/home.tsx` (blue/amber per line).  
- **Project context:** `docs/Project Architecture.md` (closure system, mobile closure calendar).  
- **List checkmark fix:** `docs/List_Page_Checkmark_Visibility_Fix.md` (for list layout parity).

---

## 5. What’s Already Aligned (no action)

- Closure API: create, get, delete – both clients.  
- Add Info: delete closures, upcoming/past split, full location name, cleaning mass-select, time off single stall, blue/amber in list and calendar.  
- Mobile closure calendar and list layout for closures already match intent of web; only optional tooltip and minor alignment remain.

This plan is a living list: implement in the order above (or adjust per priority) and update the doc as items are done.
