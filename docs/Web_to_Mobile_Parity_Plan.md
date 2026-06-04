# Web-to-Mobile Parity Plan

## June 4, 2026 — Session log (mobile design & polish; end of day)

**What we did today (mobile only unless noted):**

| Area | Done |
|------|------|
| **Food List** | Quick Add (W1/W2): Home/Out, Out location required + saved-location suggestions; sage **Home** card colour; orange/emerald row icons; Quick Add **collapsed by default**; smaller green add buttons; **no header back arrows** on list + item edit (system/gesture back); Home edit = Fridge/Snacks only, Save Changes, no Delete, name→underline spacing; Out edit = locations + food categories, Delete, extra top padding for name |
| **Home** | “Closed Today” banner layout (icon + text column); big home cards left as-is (user happy with tap size) |
| **Add Info — closures** | Calendar legend above weekday row; combo day colour (half blue / half amber); grouped **Scheduled Closures** list via `shared/business-logic`; **removed “Past closures” list** (past dates stay on calendar) |
| **Add Info — hub UI** | **Add Info** landing: **no top back arrow** (use system back to Home); **titles moved below notch** — `SafeAreaProvider` in `App.tsx` + `useSafeAreaInsets` header padding on Add Info / Closure / Expiry (and cleaning/time-off calendar) |
| **Add Info — cleaning location** | Web parity: “X stalls identified…”, orange **Mark all** button, **Select specific stalls** (scrollable list; Cancel/Save below list); location matching (`Clementi` → hawker name); skip already-saved cleaning dates |
| **Mobile keyboard UX** | Cleaning/time-off: `KeyboardAvoidingView` + scroll focused field into view — **any screen with bottom `TextInput` must keep the field visible above the keyboard** (standard app expectation) |
| **Expo** | `metro.config.js` for `shared/` imports; reload tips in `docs/Loading_on_Expo_Go_Troubleshooting.md` |

**Still open (function > design):**

- **Decide** — Location/Food tabs, drill-down, closed-today styling (§2.3; **largest gap** — not started on mobile).
- **Add Info calendar (time off + polish)** — multi-date select, time-off range text, grouped time-off list, selected-dates banner, past dates selectable on time off, dark blue = 2+ locations, orange rings on selected days, etc. (§0c / §0d). **Cleaning location + mass/single stall save ≈ web** (June 4); rest of calendar backlog remains.
- **Home closure banner** — blue cleaning / amber time off; “time off until …”; dedup vs weekly closed (§0 #8, §0d #9–11).
- **Add Location dialog (W6)** — location suggestions when editing Out item locations (same tap rules as Quick Add).
- **Polish optional:** `capitalizeWords` on blur/save (imported but not always applied); Food Wasted screen; native expiry push (W5); archive stats on list; many buttons still default **black** on mobile (cosmetic).

**Honest status (June 4, 2026):** We have **not** done everything. Daily-use paths (home, food lists, quick add, expiry, basic closures, cleaning-by-location) are in good shape after today. **Decide**, **full calendar/time-off parity**, and **home banner colours/copy** are still real gaps vs web. Anything marked ✅ here or in §0e should still be **spot-checked on a real phone** (Expo Go) — bugs may exist that we have not hit yet; that is normal until you test each flow once.

**Be careful next session:**

- **Home vs Out item edit** — do not add Out fields to Home or vice versa; Home has no Delete by design.
- **Back arrows** — Food List flow uses system back only; Add Info **hub** has no back arrow; **inside** Add Info (Closure → Cleaning, Expiry steps) still uses header back for in-flow navigation.
- **Safe area** — hub screens use manual `insets.top + 16` on the header; need `SafeAreaProvider` at app root or titles sit under the camera/notch.
- **Keyboard** — when adding bottom inputs (closure location, Quick Add, etc.), use `KeyboardAvoidingView` and/or scroll-to-focused-field so the user can always see what they type; Android may need `softwareKeyboardLayoutMode: "resize"` in `mobile/app.config.js`.
- **Select specific stalls** — stall checklist is a **bounded `ScrollView`**; Cancel/Save sit **below** the list (not inside the scroll), matching web.
- **Do not clear local storage** (user rule).
- **Web** — do not change unless asked; verify behaviour in `client/src` before “fixing” mobile from old doc rows.

**Design note:** Mobile intentionally uses **larger cards and tap targets** than web (user preference). Remaining gaps are mostly **behaviour/calendar/Decide**, not making mobile look like a desktop site.

---

**Purpose:** Bring the mobile app in line with recent web changes. Web is the primary test surface; changes should be transferred to mobile so both behave the same.

**Last updated:** June 4, 2026 (session log; pushed end-of-day — Food List polish, Add Info hub/cleaning/keyboard; not full parity)

**Note:** Some business logic functions are now shared in `shared/` folder:
- ✅ `shared/utils.ts` - capitalizeWords, normalizeLocKey
- ✅ `shared/business-logic.ts` - categorizeFood, getClosureDisplayLocation
- ✅ `shared/expiry-reminders.ts` - home “Expiring Soon” list (12-day window; bread excluded in logic only)
- ✅ `shared/home-list-sort.ts` - home Food List order (leftovers first, then soonest expiry)
Both web and mobile **can** import from these shared files; not every screen uses every module yet (see §0e).

**Start here for next mobile session:** §0e (June 2026 audit) — then **§Foundational rules** below — then **one** backlog item (e.g. W1–W6 in §0e).

**Verification:** Plan items are checked against **current web code** (client/src) so we don’t ask mobile to “fix” something web doesn’t do or overwrite with old doc behavior. Where web and mobile already match, the plan says “Parity: matched” and no change is requested.

---

## Foundational rules (read first — every mobile parity task)

**Audience:** You (human) and **any AI** implementing mobile catch-up. Follow these before editing code.

### 1. Source of truth

| Layer | Source of truth | Rule |
|--------|-----------------|------|
| **Behaviour / function** | **Web app** (`client/src/`) | Web is what the user edits and ships daily. Mobile must **match what web does now**, not what an old doc row says. |
| **Data** | **API + DB** | Both apps use the same backend. No mobile-only API shapes unless the user asks. |
| **Shared rules** | **`shared/`** | If a rule must not diverge (sort order, expiry window, location display, categories), put it in `shared/` and import from both apps. **Do not** copy-paste the same formula into web and mobile separately. |

### 2. Hard constraints (do not break these)

1. **Do not change the web app** when doing mobile parity **unless the user explicitly asks**. Read web files; edit only `mobile/` (and `shared/` when appropriate).
2. **Do not delete** existing mobile or web features, routes, or doc sections **without asking** the user first.
3. **One functional slice per session** — e.g. “Food List Out + locations”, not “sync everything”. Reduces breakage and makes testing possible.
4. **Do not assume parity from this document** — older sections (§0, §0c, §0d) can be stale. **Open the web file** and **grep mobile** before claiming done.
5. **Function first, aesthetics second** — match flows, validation, and data; RN layout may differ. Hover → long-press or omit; browser notifications → optional native later.

### 3. How to implement one slice (workflow for AI)

1. **Name the slice** (e.g. W1 in §0e) and the **web reference file(s)** (e.g. `client/src/pages/list.tsx`, `client/src/hooks/use-saved-locations.ts`).
2. **Read web end-to-end** for that slice: state variables, validation, API calls, edge cases (blur, multi-select, save filters).
3. **Check mobile** for what already exists; reuse `shared/` if present.
4. **Implement in `mobile/src/` only** (add `mobile/src/hooks/` etc. as needed). Mirror **behaviour**, not line-by-line JSX.
5. **RN input / suggestions:** When copying web location autocomplete, taps must **set state on press** and **not** rely on `blur()` before the value commits (see `docs/Problems and Fixes.md` May 3, 2026). Use `Pressable`/`TouchableOpacity` `onPress` to apply pick; optional `onPressIn` to keep keyboard; delay hiding suggestions ~200ms on `TextInput` `onBlur` if needed.
6. **Keyboard visibility:** Bottom `TextInput` fields must stay visible while typing (`KeyboardAvoidingView`, scroll on focus, extra scroll padding). Users expect to see the field and label above the keyboard — same as native apps.
7. **Test on Expo Go** (or simulator) for that slice only; do not refactor unrelated screens.
8. **Update §0e** (and the slice row): mark ✅ with date or note “done”; do not remove historical §0c detail.

### 4. What “identical” means (so expectations are clear)

- **Identical:** Same user can achieve the same outcome (add Out item with required location + suggestions; mark cleaning for date range; see Expiring Soon on home; etc.).
- **Acceptable differences:** OS install, safe areas, no mouse hover tooltips, optional push vs browser notifications, scroll/gesture feel.
- **Not acceptable:** Mobile silently omits a required field, blocks an action web allows, or uses different save rules without user approval.

### 5. Priority order when choosing the next slice

Use §0e **Suggested order**. Default high-impact slices:

1. ~~**W1**~~ — Food List Out: Quick Add + location required + saved-location suggestions ✅ June 4, 2026  
2. **Add Info calendar batch** — §0c Fixes 1–8 (multi-date, list grouping, etc.)  
3. **Home closure banner** — §0d #8–11  
4. **Decide** — §2.3 (largest; own session)

### 6. Shared modules (use before duplicating logic)

| Module | Purpose |
|--------|---------|
| `shared/utils.ts` | `capitalizeWords`, `normalizeLocKey` |
| `shared/business-logic.ts` | `categorizeFood`, `getClosureDisplayLocation` |
| `shared/expiry-reminders.ts` | Home “Expiring Soon” list |
| `shared/home-list-sort.ts` | Home Food List sort (leftover → expiry → name) |

Mobile-only storage (e.g. saved locations history): `mobile/src/hooks/use-saved-locations.ts` — mirror web hook API; use AsyncStorage instead of `localStorage`. **Same** `STORAGE_KEY` string as web (`food-compass-saved-locations`) so behaviour stays aligned if both ever share a device WebView (optional).

**Expo / Metro:** Imports from `shared/` require `mobile/metro.config.js` (`watchFolders` → repo root). Without it, Expo Go shows **500** / “Unable to resolve module ../../../shared/…”. See `docs/Loading_on_Expo_Go_Troubleshooting.md` (June 4, 2026).

### 7. Key web → mobile file map (quick reference)

| Feature | Web (read this) | Mobile (edit this) |
|---------|-----------------|-------------------|
| Food List / Quick Add | `client/src/pages/list.tsx` | `mobile/src/screens/FoodListsScreen.tsx` |
| Saved locations hook | `client/src/hooks/use-saved-locations.ts` | `mobile/src/hooks/use-saved-locations.ts` |
| Home banners | `client/src/pages/home.tsx` | `mobile/src/screens/HomeScreen.tsx` |
| Closures / calendar | `client/src/pages/add-details.tsx` | `mobile/src/screens/AddInfoScreen.tsx` |
| Decide | `client/src/pages/decide.tsx` | `mobile/src/screens/DecideScreen.tsx` |

### 8. When stuck

- Re-read the **web handler** for the button/save path — do not invent mobile-only rules.  
- If web and doc disagree, **web wins**. Update the doc after confirming in code.  
- If the slice is too big, split (e.g. “Out location required” first, then “suggestions”) and document what’s left in §0e.

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
| 8 | **Colors:** Cleaning = blue, time off = amber (list rows, calendar modifiers, home banner lines) | ⚠️ Partial | Add Info list + calendar: ✅. **Home banner: ❌** – mobile still all amber; add blue for cleaning lines in `HomeScreen.tsx`. |
| — | **Add Info hub safe area + back** | ✅ June 4, 2026 | Landing: no header back (system back to Home); titles use `useSafeAreaInsets` so not under camera/notch. |
| 9 | **Location input (closure):** Focus ring inset so edges don’t clip; `px-1` wrapper; label aligned with input | N/A (web only) | Low: if mobile location input feels misaligned, add matching horizontal padding. |
| 10 | **Decide – hide header back:** When drilled into Go Out → Food (category) or Go Out → Location (location), hide header back; only “Back to Categories” / “Back to Locations” | ❌ No | Mobile Decide doesn’t have Location/Food drill yet; when you add it (section 2.3), also hide header back when drilled in. |
| 11 | **Calendar multi-date selection:** Can select multiple dates (including saved dates) - orange border persists on all selected dates | ❌ No | **CRITICAL:** See section 0c below for detailed steps. |
| 12 | **Calendar dark blue logic:** Dark blue only for 2+ distinct locations (not 2+ stalls) | ❌ No | **CRITICAL:** See section 0c below for detailed steps. |
| 13 | **Location capitalization normalization:** Prevent duplicates like "Margaret Drive" vs "Margaret drive" | ❌ No | **CRITICAL:** See section 0c below for detailed steps. |
| 14 | **Past closures removed:** Removed "Past closures" sections from UI (past dates still visible on calendar) | ✅ June 4, 2026 | None. |
| 15 | **Past dates selectable in Time Off:** Past dates no longer disabled in Time Off calendar | ❌ No | Mobile still disables past dates () - remove this restriction. |
| 16 | **Selected dates banner:** Shows "2 days — 9 Feb, 10 Feb" under calendar when dates selected | ❌ No | Add banner showing selected dates count and list. |
| 17 | **getClosureDisplayLocation exact match:** Uses exact match (case-insensitive) instead of includes() to prevent wrong location display | ❌ No | **CRITICAL:** See section 0c below for detailed steps. |
| 18 | **Time off date range grouping:** Time off list grouped by stall + consecutive dates (e.g. "Margaret Drive › Duck Rice — 9–15 Feb" one row, not 7 rows) | ❌ No | **CRITICAL:** Same logic as cleaning: buildTimeOffGroups, mergeConsecutiveDates; list shows groups with date range; delete group = delete all ids. |
| 19 | **Time off: same date many times:** One date can have multiple time-off entries (different stalls) and both cleaning + time off; no disabling dates for time off | ❌ No | **CRITICAL:** selected=selectedTimeOffDates only; disabled=undefined; onSelect accepts all dates; allow adding time off on dates that already have cleaning or time off. |
| 20 | **Combo color (cleaning + time off same day):** When a date has BOTH cleaning and time off, show blue-to-amber gradient (not default to orange/last input) | ✅ June 4, 2026 | Half blue / half amber in `AddInfoScreen` calendar (both tabs show both modifier colours). |
| 21 | **Time off: Add Date Range input:** Add a text range input using words (e.g. "7 Apr to 20 May") that fills the selected time-off dates (no one-by-one tapping) | ❌ No | Add `timeOffRangeText` + parse "D Mon to D Mon" into Date[]; Apply merges into selected dates; show parse error only after blur/apply. Reference: `client/src/pages/add-details.tsx` (Time Off section). |
| 22 | **Time off: dark orange for overlaps:** If 2+ distinct time-off entries exist on the same date (different stalls), show a darker orange on that day cell | ❌ No | Add `getTimeOffEntryCountForDate(date)` and apply darker orange when count >= 2. Reference: `client/src/pages/add-details.tsx`. |
| 23 | **Decide: show “closed today” while browsing:** Decide lists should visually mark stalls closed today due to cleaning/time off (light red tint + “Closed today …”), and weekly closedDays should actually affect availability without requiring a click | ❌ No | Fetch closures for today in mobile Decide; compute availability per location context; tint closed-by-schedule rows and show badge. Reference: `client/src/pages/decide.tsx`. |

**Summary:** Items 1–3, 5–7 are done on mobile. Item 4 (tooltip) and 9 (input alignment) are optional/low. Item 8 – **Home closure banner colors** still needs to be done on mobile. Item 10 – **Decide** (tabs + drill + hide back) is the big parity piece not yet on mobile. **Items 11–20** are calendar/time-off fixes that need to be replicated on mobile (section 0c + items 18–20).

**⚠️ Stale as of June 2026:** §0d item 14 says mobile has no home expiry sort — mobile **now uses** `shared/home-list-sort.ts`. See §0e for current truth.

---

## 0e. June 4, 2026 — Parity audit (web vs mobile vs this doc)

**Method:** Read-only check of `client/src` (web, your daily driver), `mobile/src` (Expo app), and `shared/`. **No web changes** for this audit.

### How far off are we? (rough)

| Area | Web (today) | Mobile (today) | Gap |
|------|-------------|----------------|-----|
| **Home – Expiring Soon** | Banner + optional browser “Enable alerts” | In-app banner only (shared logic) | Small (native push optional later) |
| **Home – Closed Today** | Blue cleaning / amber time off; time off “until …”; dedup vs weekly closed | All amber; simpler lines; no “until” / dedup | Medium |
| **Food List – Home** | Quick Add; leftover-first + expiry sort; archive stats | Quick Add ✅; same sort; sage card; item edit polish ✅ | Small (archive stats optional) |
| **Food List – Out** | Quick Add + **location required** + saved-location suggestions | Quick Add + locations ✅ (W1); item edit polish ✅ | Small (W6 location dialog suggestions) |
| **Add Info / closures** | Full calendar/time-off UX (grouped lists, range input, combo colors, no “Past closures” list UI) | Combo colours + grouped scheduled list + no past list ✅; hub safe area ✅; many §0c calendar items still open | **Medium–Large** |
| **Decide** | Location/Food tabs, drill-down, closed-today styling | Flat SectionList by location only | **Largest** |
| **Food Wasted** | Dedicated page | No screen | Optional |

Overall: **you can use mobile for basics** (lists, expiry banner, closure create/delete, simple Decide). **Daily parity with how you use the web** still needs Food List Out + location history, then Add Info calendar/time-off batch, then Decide.

---

### Corrections to older sections of *this* document

| Older doc claim | Actual code (June 2026) |
|-----------------|-------------------------|
| §0d #14 — mobile Home list has no expiry-first sort | ❌ Stale — `FoodListsScreen.tsx` sorts with `compareHomeFoodListItems` (`shared/home-list-sort.ts`): **leftovers first**, then soonest expiry, then name |
| §2.5 — “Upcoming vs past closures ✅ Same” on mobile | ✅ **Fixed June 4, 2026** — past closures list removed; past dates remain on calendar only |
| §0b — mobile needs `capitalizeWords` | ⚠️ Still true in behaviour — `AddInfoScreen` **imports** `capitalizeWords` / `normalizeLocKey` but **does not call them** anywhere in `mobile/` yet |
| §0 items 1–7 “done on mobile” | ✅ Still accurate for delete closures, mass cleaning, button copy, etc. |

---

### Web changes **not** listed in §0 / §0c / §0d yet (add to next mobile work)

| ID | What web has now | Mobile today | Next mobile action |
|----|------------------|--------------|-------------------|
| **W1** | **Food List Quick Add** — expand panel; Home/Out; Out **requires location**; `useSavedLocations` autocomplete from store + history | ✅ **Done June 4, 2026** — `FoodListsScreen.tsx` + `mobile/src/hooks/use-saved-locations.ts` | None for list quick add |
| **W2** | **Location suggestion tap** — apply on press; no blur-before-setValue | ✅ **Done with W1** — `Pressable` + `applyLocationPick` (see §Foundational rules) | Reuse in **W6** Add Location dialog |
| **W3** | **Home list: leftovers pinned to top** then expiry order | ✅ `shared/home-list-sort.ts` | **None** — keep shared module in sync if sort rules change |
| **W4** | **Home: “Expiring Soon”** banner (12-day window) | ✅ `shared/expiry-reminders.ts` on `HomeScreen` | **None** for in-app banner |
| **W5** | **Browser expiry alerts** (opt-in, once/day on home load) | N/A | Optional: `expo-notifications` if you want push without opening app |
| **W6** | **Add Location dialog** — location name suggestions (same tap rules as W2) | Location modal = plain `TextInput` only | Add suggestions + pick handling when editing item locations |

---

### Still open from §0 / §0c / §0d (code-verified)

**`mobile/src/screens/AddInfoScreen.tsx`** (closure / time off) — doc steps still apply; confirmed in code:

- [ ] **Multi-date:** `if (isDateSaved(date, type)) return` still blocks re-select (~155)
- [x] **Remove “Past closures” list section** — done June 4, 2026 (past dates remain on calendar only)
- [ ] **Time off:** past dates still disabled via `isPast` pattern (~848–886 area)
- [ ] **Selected dates banner**, **time-off range text**, **buildTimeOffGroups** / grouped scheduled list, **combo day colors**, **dark blue = 2+ locations**, duplicate-date filter on save, cross-month range labels, etc. — see §0c checklist (unchanged)

**`mobile/src/screens/HomeScreen.tsx`**

- [ ] Closure line colors by type (§0 #8, §0d #9–11)
- [x] Expiring Soon (W4)

**`mobile/src/screens/DecideScreen.tsx`**

- [ ] Full §2.3 parity: `outTab`, location drill, food category drill, hide header back when drilled, **closed today** tint/badge (§0 #23, `decide.tsx`)

**`mobile/src/screens/FoodListsScreen.tsx`**

- [x] Home sort (W3 + §0d #14)
- [x] W1 / W2 / saved locations (June 4, 2026)
- [x] Home/Out colours, Quick Add collapsed default, item edit Home vs Out, no list back arrows (June 4, 2026)
- [ ] Eaten/thrown **stats** section like web list (optional)

**`mobile/App.tsx` + Add Info hub headers**

- [x] `SafeAreaProvider` + Add Info landing without back arrow; hub titles below notch (June 4, 2026)

**Other**

- [ ] **Food Wasted** screen (§2.5) — web only
- [ ] **capitalizeWords** actually used on blur/save (not just imported)

---

### Suggested order for the *next* mobile-only session

1. **Add Info — calendar “batch 1”** from §0c: multi-select, selected-dates banner, time-off past dates allowed  
2. **Add Info — calendar “batch 2”** from §0c/0d: time-off grouping/range input, dark blue logic, save filters  
3. **Home closure banner (§0d #8–11)** — blue/amber, until date, dedup  
4. **Decide (§2.3)** — dedicated session (largest)  
5. **Polish:** location dialog suggestions (W6), Food Wasted, native expiry push (W5), list archive stats

---

### Files to touch (mobile only, when you implement)

| File | Typical work |
|------|----------------|
| `mobile/src/screens/FoodListsScreen.tsx` | W1, W2, stats optional |
| `mobile/src/hooks/use-saved-locations.ts` (new) | Mirror web hook + AsyncStorage |
| `mobile/src/screens/AddInfoScreen.tsx` | §0c/0d calendar + closures list |
| `mobile/src/screens/HomeScreen.tsx` | Closure banner colours / until / dedup |
| `mobile/src/screens/DecideScreen.tsx` | §2.3 |
| `shared/*.ts` | Prefer extend shared logic; UI stays separate |

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

### Fix 9: Time Off Date Range Grouping (Same as Cleaning)

**Problem:** Time off list shows one row per day (e.g. 7 rows of "Duck Rice closed" for a week). Should show one row per stall with date range (e.g. "Margaret Drive › Duck Rice — 9–15 Feb").

**What to Do:** Reuse the same grouping logic as cleaning:
1. **buildTimeOffGroups(timeoffClosures):** Group by stall (location + food item name). For each stall, collect date → ids. Run **mergeConsecutiveDates** on that map to get date ranges. Produce list of `{ type: 'timeoff', dateRange, displayLabel, ids }`.
2. **Scheduled list:** Show time off as grouped rows (displayLabel + dateRange); one delete = delete all ids in group.
3. **Do not** show raw time-off closures one-by-one in the list.

**Web Reference:** `client/src/pages/add-details.tsx` – buildTimeOffGroups, TimeOffGroup type, mergeConsecutiveDates (shared with cleaning), list render by entry.type === 'timeoff'.

**Exact Mobile Changes:**
- Add TimeOffGroup type and buildTimeOffGroups (mirror buildCleaningGroups but for type === 'timeoff', group by location+foodItemName).
- Build upcomingTimeOffGroups / pastTimeOffGroups and use in list instead of raw time-off array.
- Render time-off list rows with dateRange and delete group (handleDeleteClosureGroup(g.ids)).

---

### Fix 10: Time Off – Same Date Multiple Times / No Disabled

**Problem:** User must be able to add time off for many stalls on the same day (e.g. CNY); same date can have both cleaning and time off. Calendar must not "default to orange" or block selection.

**What to Do:**
1. **selected** = only `selectedTimeOffDates` (user selection), not saved dates.
2. **disabled** = none (or only block cleaning days if you want; web allows all).
3. **onSelect** = accept all selected dates; allow same date to be selected again after saving (so they can pick another stall).
4. **DayButton:** When date has **both** cleaning and time off, show **combo style** (Fix 11).

**Web Reference:** `client/src/pages/add-details.tsx` – Time Off Calendar selected/onSelect/disabled, and DayButton combo (both).

---

### Fix 11: Combo Color (Cleaning + Time Off Same Day)

**Problem:** When a date has both cleaning and time off, the cell was defaulting to one color (e.g. orange/last input). User needs to see that both apply.

**What to Do:** In the calendar DayButton for both Cleaning and Time Off tabs:
- If `isCleaning && isTimeoff` → apply **combo style**: e.g. blue-to-amber gradient (`from-[#2563eb] to-[#f59e0b]`), or half-and-half, so it’s clearly both.
- Else if only cleaning → blue; else if only time off → amber.

**Web Reference:** `client/src/pages/add-details.tsx` – DayButton: `style={both ? { background: 'linear-gradient(to right, #60a5fa 0%, #60a5fa 50%, #fbbf24 50%, #fbbf24 100%)' } : undefined}`, and single-color `#60a5fa` / `#fbbf24`.

**Exact Mobile Changes:**
- Cleaning-only: background #60a5fa, white text. Time-off-only: background #fbbf24, dark text. Both: literal two halves (left blue, right amber), e.g. two View columns or 50%-50% linear gradient with hard stop.

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
- [ ] **Fix 9:** Time off date range grouping - buildTimeOffGroups, list by group with date range, delete group
- [ ] **Fix 10:** Time off same date multiple times - selected=user only, no disabled, allow re-select after save
- [x] **Fix 11:** Combo color — half blue / half amber when both types on same day (June 4, 2026)

**Reference Files:**
- Web calendar logic: `client/src/pages/add-details.tsx` (Cleaning calendar, Time Off calendar, DayButton combo style)
- Web grouping: buildCleaningGroups, buildTimeOffGroups, mergeConsecutiveDates (same file)
- Web location normalization: `client/src/pages/add-details.tsx` lines 177-201, 854, 899-930
- Calendar Problems doc: `docs/Calendar Problems and Fixes.md` (February 3, 2026 section)

---

## 0d. March 6, 2026 Web Changes — Mobile Parity Needed

**Date:** March 6, 2026  
**Reference:** `docs/Calendar Problems and Fixes.md` (March 6, 2026 section)

| # | Web change | Applied to mobile? | Action |
|---|------------|--------------------|--------|
| 1 | **Time Off calendar: cleaning dates no longer disabled/blocked** — Cleaning days within a time-off range are now selectable; a date can be both cleaning and time off. `disabled` prop removed; `onSelect` no longer strips cleaning dates. | ❌ No | Mobile still has cleaning dates disabled/blocked in time off flow. Remove that restriction in `AddInfoScreen.tsx` (same as Fix 10 in section 0c — now also web-confirmed). |
| 2 | **Continuous time-off date range** — Removing the disabled/filter above means the `mergeConsecutiveDates` logic now sees a full unbroken chain (e.g. 9 Mar–9 Apr instead of 3 fragments). | ❌ No | Follows automatically from item 1 above once applied to mobile. |
| 3 | **Half-half split colour now works** — When a date has both cleaning and time off, the blue/amber gradient now actually renders (was dead code before because overlap was impossible). | ❌ No | Same as Fix 11 in section 0c — now confirmed working on web. Apply gradient to mobile day cells when `isCleaning && isTimeoff`. |
| 4 | **Time Off calendar: orange ring on selected dates** — Added `isInSelected` check and `ring-2 ring-orange-500` class to time-off DayButton, matching cleaning calendar. | ❌ No | Add orange border/ring to selected time-off dates in `AddInfoScreen.tsx` (mirrors Fix 1 / Fix 8 from 0c). |
| 5 | **Time Off calendar: "X days closed" count text** — Shows count of selected days below calendar (was missing entirely on time off; cleaning had it). Both calendars now show "X days closed". | ❌ No | Add/update selected-dates text in `AddInfoScreen.tsx` for time off. Change existing cleaning text to "X days closed" if it's still showing the verbose date list format. |
| 6 | **Re-clicking saved orange (timeoff) dates now works** — Fixed double-filter bug: `onSelect` was stripping saved timeoff dates right back out. Now re-clicking a saved amber date shows the ring so another stall can be added. | ❌ No | Check mobile `toggleDateSelection` — ensure clicking a saved timeoff date adds it back to selection (don't return early if already saved). |
| 7 | **Cross-month date range display fixed** — `formatDateRange` was always using the start month for both numbers ("9–9 Mar" instead of "9 Mar–9 Apr"). Fixed to include both months when range crosses a month boundary. | ❌ No | Update equivalent date-range formatting in `AddInfoScreen.tsx`. Check how the scheduled closures list formats date ranges and add the cross-month case. |
| 8 | **Calendar day gaps** — Fixed long-standing "blocks glued together" issue. Root cause: rows use `flex` layout so `border-spacing` was ignored. Fix: `gap-1` added to `weekdays` and `week` classNames in `calendar.tsx`. | N/A | Mobile uses React Native calendar (custom day cells, not HTML table). Gap between day cells is controlled differently — check `AddInfoScreen.tsx` day cell styles and add margin if blocks look stuck. |
| 9 | **Home banner: regular closure takes precedence over time off** — If a stall is already listed as regularly closed today (weekly schedule), its time-off entry is suppressed from the orange section to avoid duplicates. | ❌ No | Apply same deduplication in `HomeScreen.tsx`: when building banner lines, filter out time-off entries whose `foodItemName` already appears in the regular-closures list. |
| 10 | **Home banner: time off shows end date** — Orange lines now read "Ghim Moh — Mushroom Noodles time off until 9 Apr" instead of generic "closed today". Looks up the last date of the stall's time-off run from all stored closures. | ❌ No | In `HomeScreen.tsx`, fetch all closures (not just today's), find the last date for each time-off stall, and append "until X" to the banner line. |
| 11 | **Home banner: label changed** — "closed today" → "time off until [date]" for time-off entries (drops the "on" for grammar). | ❌ No | Covered by item 10 above. |

| 12 | **Save toast grammar fix** — Time off save confirmation now reads "Mushroom Noodles time off from 9 Mar to 9 Apr." (was "time off on 32 days"). Computes start and end date from selected dates array. | ❌ No | Find the save toast in `AddInfoScreen.tsx` for time off. Sort selected dates, format first and last as "D Mon", build string: `${itemName} time off from ${start} to ${end}.` (or just `from ${date}.` for single day). |
| 13 | **Closure list sorted by date** — Scheduled closures list now sorts all entries (cleaning + time off mixed) chronologically by start date. Previously insertion order caused e.g. 11 Mar to appear above 10 Mar. | ❌ No | In `AddInfoScreen.tsx`, after building the combined closures list (cleaning + time off groups), sort by each group's start date string (YYYY-MM-DD, so string sort = chronological). Add `startDate` field to each group when merging consecutive dates. |
| 14 | **Home food list: expiry-first sort** — In the Home tab of Food Lists, items with expiry dates now appear first sorted by soonest expiry, then remaining items alphabetically. | ❌ No | In `FoodListsScreen.tsx` (or wherever Home items are sorted), update sort: if both have expiry → sort by date asc; if only one has expiry → that one comes first; if neither → alphabetical. **Check first** whether mobile Home list already shows expiry dates — if expiry display doesn't exist on mobile yet, this sort is low priority until it does. |

### Summary for mobile
Items 1–3 complete the Fix 10 + Fix 11 work from section 0c (now confirmed working on web).  
Items 4–6 complete Fix 1 + Fix 8 from 0c for the time-off calendar specifically.  
Items 7–8 are display/formatting fixes.  
Items 9–11 are home banner improvements.  
Items 12–13 are save toast and list ordering fixes.  
Item 14 is a food list sort improvement (check mobile expiry support first).

**Files to update on mobile:**
- `mobile/src/screens/AddInfoScreen.tsx` — items 1–8, 12–13
- `mobile/src/screens/HomeScreen.tsx` — items 9–11
- `mobile/src/screens/FoodListsScreen.tsx` — item 14 (after checking expiry support)

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
| Quick add with location (Out) | ✅ | ✅ | **Done June 4, 2026** (W1). |
| Saved locations / autocomplete | ✅ useSavedLocations | ✅ | `mobile/src/hooks/use-saved-locations.ts` (W1/W2). |
| Home list sort (leftover → expiry → name) | ✅ `compareHomeFoodListItems` | ✅ Same shared module | **Done (June 2026).** See §0e W3. |
| Home “Expiring Soon” on Food List home tab | N/A (banner on **Home** page) | N/A | Expiry **banner** is on Home screen (W4), not List tab. |
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
