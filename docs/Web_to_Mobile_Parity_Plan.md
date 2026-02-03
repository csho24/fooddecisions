# Web-to-Mobile Parity Plan

**Purpose:** Bring the mobile app in line with recent web changes. Web is the primary test surface; changes should be transferred to mobile so both behave the same.

**Last updated:** Feb 2026 (from recent chat changes)

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

**Summary:** Items 1–3, 5–7 are done on mobile. Item 4 (tooltip) and 9 (input alignment) are optional/low. Item 8 – **Home closure banner colors** still needs to be done on mobile. Item 10 – **Decide** (tabs + drill + hide back) is the big parity piece not yet on mobile.

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
