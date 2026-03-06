# Problems and Fixes Log

This document tracks specific problems encountered and their solutions.

---

# March 6, 2026 — Time Off calendar parity, broken date ranges, cross-month display

**Date:** March 6, 2026  
**Status:** ✅ All issues resolved

---

## Background

User was trying to mark Mushroom Noodles (Ghim Moh) as closed from 9 Mar to 9 Apr. Several things went wrong, traced to a core design misunderstanding plus missing parity between the cleaning and time-off calendars.

---

## Issue 1: Time-off date range broken into 3 separate segments

### Problem
Selecting 9 Mar–9 Apr showed up in the scheduled closures list as three separate entries:
- 9–15 Mar
- 18–22 Mar
- 25 Mar–9 Apr

### Root Cause
Cleaning days (16–17 Mar, 23–24 Mar) fell within the time-off range. The time-off calendar had `disabled={(date) => isDateSaved(date, 'cleaning')}`, so those dates could not be selected. The `onSelect` filter also stripped cleaning dates out: `dates.filter(d => !isDateSaved(d, 'timeoff') && !isDateSaved(d, 'cleaning'))`. This left gaps in the saved chain. When `mergeConsecutiveDates` built the display ranges, the gaps broke the range into 3 parts.

### Root Misunderstanding
The original design treated cleaning and time-off as mutually exclusive — cleaning dates were disabled in the time-off calendar and vice versa. But they are **independent events**: a stall being on time-off does not prevent the hawker centre from doing cleaning on those same days. The two can and should overlap.

### Fix
- Removed `disabled={(date) => isDateSaved(date, 'cleaning')}` from the time-off calendar entirely.
- Changed `onSelect` filter to only exclude already-saved timeoff dates: `dates.filter(d => !isDateSaved(d, 'timeoff'))`.
- Cleaning dates within a time-off range now save as both types and display with the half-blue/half-amber split colour (which already existed in code but was unreachable — see Issue 3).

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Issue 2: No visual feedback when clicking blue (cleaning) dates in time-off calendar

### Problem
Clicking a blue cleaning date in the time-off calendar did nothing visible — no colour change, no ring, no indication whether the date was being included or not.

### Root Cause
Same as Issue 1 — the dates were `disabled`, so all click events were completely suppressed by the calendar component.

### Fix
Removing the `disabled` prop (from Issue 1 fix) also fixed this — cleaning dates are now clickable and show the split half-half colour when selected for time-off.

---

## Issue 3: Half-half split colour was dead code

### Problem
The half-blue/half-amber gradient style existed in the time-off DayButton (and the cleaning DayButton), but never actually appeared on screen.

### Root Cause
The gradient triggers when `both = isCleaning && isTimeoff` is true. In the time-off calendar, `isCleaning` comes from `modifiers.cleaning` (saved cleaning dates), and `isTimeoff` comes from `modifiers.timeoff` (saved + selected timeoff dates). But since cleaning dates were disabled and filtered out, a date could never be in both modifiers at the same time. The gradient was unreachable.

### Fix
Once the `disabled` constraint and `onSelect` filter were removed (Issue 1), selecting a cleaning date for time-off sets both modifiers to true, and the split colour now works as intended.

---

## Issue 4: Time-off calendar missing parity with cleaning calendar

### Problem
User explicitly stated both calendars should "work the same way." The time-off calendar was missing three features that the cleaning calendar had:

1. **Selected count text** — Cleaning showed "X days closed" below the calendar as dates were picked. Time-off showed nothing.
2. **Orange ring on selected dates** — Cleaning dates got an orange ring (`!ring-2 !ring-orange-500`) when freshly selected. Time-off had no such indicator.
3. **Re-clicking saved dates** — Cleaning calendar had a custom `onClick` handler so clicking a saved (blue) date would re-add it to selection (ring appears) for adding another location. Time-off had no equivalent, so clicking a saved (amber) date did nothing.

### Fix
- Added `isInSelected` and `isAlreadySaved` variables to the time-off DayButton, matching the cleaning calendar exactly.
- Added orange ring class: `isInSelected && "!ring-2 !ring-orange-500 !ring-offset-2"`.
- Added custom `onClick` handler for saved timeoff dates.
- Added the "X days closed" count paragraph inside the `selectedTimeOffDates.length > 0` block.

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Issue 5: Clicking saved orange (timeoff) dates still showed no reaction after initial fix

### Problem
After the parity fix above was applied, clicking already-saved orange dates in the time-off calendar still produced no ring or visual response.

### Root Cause
A second filter was undoing the fix. In `onSelect`, the filter `dates.filter(d => !isDateSaved(d, 'timeoff'))` stripped saved timeoff dates back out immediately after the calendar added them. The custom `onClick` tried to add them to `selectedTimeOffDates`, but `onSelect` ran right after and wiped them out.

### Fix
Removed `!isDateSaved(d, 'timeoff')` from the `onSelect` filter entirely. The calendar now accepts all dates from its toggle, including re-clicked saved dates. The `onSelect` only deduplicates (via `Map` by timestamp). Removed the now-redundant manual `setSelectedTimeOffDates` from the custom `onClick`.

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Issue 6: Cross-month date range displayed incorrectly ("9–9 Mar" instead of "9 Mar–9 Apr")

### Problem
A date range spanning two months (e.g., 9 Mar to 9 Apr) showed as "9–9 Mar" in the scheduled closures list.

### Root Cause
`formatDateRange()` always used the start month (`m1`) for both the start and end day numbers:
```typescript
return `${d1}–${d2} ${MONTHS_SHORT[m1 - 1]}`; // Always used start month
```
When start and end were in different months, it ignored the end month entirely.

### Fix
Added a cross-month check:
```typescript
if (m1 === m2) return `${d1}–${d2} ${MONTHS_SHORT[m1 - 1]}`;
return `${d1} ${MONTHS_SHORT[m1 - 1]}–${d2} ${MONTHS_SHORT[m2 - 1]}`;
```
Same-month ranges like "16–17 Mar" are unchanged.

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Issue 7: Selected date count listed every individual date (too verbose)

### Problem
The "X days" counter below the calendar was listing every single selected date: "32 days — 9 Mar, 10 Mar, 11 Mar, 12 Mar...". This was too long and unnecessary.

### Fix
Changed both calendars (cleaning and time-off) to just say "X days closed" with no date list.

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Issue 8: Calendar day blocks stuck together (finally fixed)

### Problem
Calendar day blocks appeared glued together with no visible gaps between them. This was raised multiple times across several sessions and was previously declared unsolvable.

### Previous Attempts (Feb 8, 2026 — all failed)
1. `border-spacing` on the `<table>` via classNames and MonthGrid inline style (`borderSpacing: "0.5rem"`)
2. CSS override in `index.css` with `!important` targeting `.group/calendar table.rdp-month_grid`
3. Cell padding `p-0.5` on the custom `<td>` Day component — this worked but caused a visible blue border artefact

### Root Cause of Previous Failures
All prior attempts targeted **table-layout** spacing properties (`border-spacing`, `border-collapse`). These only work when elements are laid out as a table. But the `<tr>` rows already have **`flex` display** applied via the `week` and `weekdays` classNames. The browser completely ignores table spacing on flex containers, so every attempt was targeting the wrong CSS layer.

### Fix
Added `gap-1` (4px) to both the weekday header row and the week rows in `calendar.tsx`:
```typescript
weekdays: cn("flex gap-1", defaultClassNames.weekdays),
week: cn("mt-2 flex w-full gap-1", defaultClassNames.week),
```
`gap` is a flex property and works correctly here. Because both the header row and day rows use the same gap, all columns stay perfectly aligned.

### Files Changed
- `client/src/components/ui/calendar.tsx`

---

## Key Lesson

**Cleaning and time-off are independent event types and can coexist on the same date.** Do not treat one as blocking the other. The original `disabled` constraint and mutual filter were based on the wrong assumption that "if a hawker centre is cleaning, a stall can't also be on time-off." They are tracked separately and displayed with a split colour when they overlap.

---

## Files Changed (6 Mar 2026)

- `client/src/pages/add-details.tsx` — all changes above

---

# January 19, 2026 - Pointy corners on “today” (e.g. day 10), greener today on blocks, half-block note

**Date:** January 19, 2026  
**Status:** Pointy corners ✅; today-on-closure green and opacity ✅; half-half gradient sliver noted for future

---

## What was done

### 1. Pointy corners on today (e.g. day 10)

**Problem:** When a day was both **today** and had a closure (cleaning/time off or both), that day had **sharp (pointy) corners** while other days with the same shading had rounded corners (e.g. day 9 rounded, day 10 pointy when day 10 was today).

**Root cause:** The calendar’s `today` modifier in `client/src/components/ui/calendar.tsx` used `data-[selected=true]:rounded-none`. When today was also “selected” (e.g. has a closure modifier), the day cell got `rounded-none`, so it looked angular.

**Fix:** In `calendar.tsx`, the `today` class was changed from  
`"rounded-md data-[selected=true]:rounded-none"`  
to  
`"rounded-xl"`  
so today always uses rounded corners and no longer gets sharp edges when it has a closure.

### 2. Other changes this session (today + closure display)

- **Darker green for today on closure blocks:** Today’s number on blue/amber blocks was updated to a darker green (`#14532d` / green-900) and the day cell is forced to `opacity: 1` when it’s today with a closure, so the number doesn’t look faded (modifiersStyles had been applying `opacity: 0.8` to the whole cell).
- **Range-middle corners:** So that “middle” days in a range don’t look pointy, `range_middle` was changed from `rounded-none` to `rounded-xl` in both the root classNames and in `CalendarDayButton` (`data-[range-middle=true]:!rounded-xl`).

### 3. Half-half gradient (blue/orange) – noted for future

**Observation:** When a day has both cleaning and time off (half blue, half orange), the 50% gradient can show a **sliver of orange at the edge** (not a perfectly crisp split). A short in-code comment was added in `add-details.tsx` next to the gradient so we remember to try a future fix (e.g. two divs or 49%/51% for a crisper edge). No code change for the gradient itself in this session.

## Files changed (19 Jan 2026)

- `client/src/components/ui/calendar.tsx` – `today` modifier: always `rounded-xl` (no `rounded-none` when selected); `range_middle` uses `rounded-xl` in root and in DayButton.
- `client/src/pages/add-details.tsx` – Today + closure: darker green (`#14532d`), `opacity: 1` in dayStyle, `!text-green-900` / `[&>span]:!text-green-900`; comment added for half-half gradient sliver (future fix).

---

# February 8, 2026 - Closure calendar: today styling, spacing attempts, blue border

**Date:** February 8, 2026  
**Status:** Today fix ✅; spacing not achieved (limitation)

---

## What was done

- **Today:** Current date shows as **green text only** (no background block). In add-details, custom DayButton checks `modifiers.today` and when it’s today and not a closure date applies `!text-green-600`. Closure dates (blue/amber blocks) unchanged; today with a closure keeps the block.
- **Today block removed:** Removed any “today” background/shade so today isn’t orange or a green block—only the number is green when it’s a plain day.
- **Blue border fix:** A visible blue border on closure dates was caused by cell padding on the custom Day `<td>`. Removed that padding and set `border-0 border-transparent` on day cells and `border-0` on the calendar table so no inherited border shows.
- **Cleaning blue lighter:** Only the **org/single-location** cleaning blue was made lighter: `#60a5fa` (was `#2563eb`). The overlapping/darker blue for 2+ locations stays `#1e40af`. modifiersStyles.cleaning fallback `#60a5fa`. Half-block styling unchanged.
- **Spacing (gaps between day blocks):** Tried table `border-spacing` + custom MonthGrid (inline style), CSS override in index.css (`.group/calendar table.rdp-month_grid` with `!important`), and small cell padding (`p-0.5`). Table spacing didn’t reliably apply (Tailwind base `table { border-collapse: collapse }` or load order). Cell padding created the blue border. **Conclusion:** No reliable way in this stack to add visible gaps without side effects; day blocks remain touching.
- **Debug:** Console and DOM confirmed custom Calendar components (Root, MonthGrid, Day) run on `/add` closure calendars. Root has `group/calendar`; table gets our inline `borderCollapse: separate` and `borderSpacing` but visual gap still doesn’t show.

### Home banner — closure count not date (8 Feb)

**Problem:** "Closed Today" banner showed the **day of the month** (e.g. 8) instead of the number of stalls closed, so it read like "8 Ghim Moh Stalls closed today" (user thought 8 stalls when it was one time off).

**Root cause:** Banner used `new Date().getDate()` (1–31) instead of the closure count for that group.

**Fix:** `closureBannerGroups` now includes `count: closures.length`. Banner line: `{g.count} {g.location} stall(s) closed today`. **File:** `client/src/pages/home.tsx`

**Note:** Time off list date-range grouping (one row per stall with e.g. "9–15 Feb") is implemented in `add-details.tsx` via `buildTimeOffGroups` and `mergeConsecutiveDates`; not separately logged here.

## Files changed (8 Feb)

- `client/src/components/ui/calendar.tsx` – Custom Day (border-0, no today bg), custom MonthGrid (inline spacing), today class no accent; debug logs and data attributes.
- `client/src/pages/add-details.tsx` – Today = green text only when `isToday && !hasClosure` (`!text-green-600`); modifiersStyles.today = transparent; closure colors unchanged.
- `client/src/pages/home.tsx` – Home banner shows closure count instead of day of month.
- `client/src/index.css` – Override for calendar table spacing (`.group\/calendar table.rdp-month_grid` with border-separate and border-spacing); not effective for gap in practice.

---

# February 3, 2026 - Cleaning Schedule Selection & Data Corruption Fixes

**Date:** February 3, 2026  
**Status:** ✅ All issues resolved

---

## Issue 1: Cannot Select Multiple Dates (Including Saved Dates)

### Problem
User could not select multiple dates for cleaning schedules, especially when one date was already saved. For example:
- Feb 9 already had a cleaning entry saved
- User wanted to add Feb 10 for the same location
- Clicking Feb 9 showed orange border
- Clicking Feb 10 moved the orange border to Feb 10, deselecting Feb 9
- Only one date could be selected at a time

### Root Cause
The calendar's `selected` prop included both saved dates AND `selectedCleaningDates`. When a saved date was clicked, the calendar treated it as "already selected" and toggled it off instead of adding it to the selection.

```typescript
// BAD: Saved dates in selected prop caused toggle behavior
selected={[...getSavedDatesForType('cleaning'), ...selectedCleaningDates]}
```

Additionally, `onSelect` was filtering out saved dates, so clicking a saved date wouldn't add it to `selectedCleaningDates`.

### Solution
1. **Separate `selected` from saved dates:**
   - `selected` prop now ONLY contains `selectedCleaningDates` (user's current selection)
   - Saved dates show via the `cleaning` modifier (blue background)
   - This prevents the calendar from toggling saved dates

2. **Allow selecting saved dates:**
   - `onSelect` now includes all selected dates (saved or not)
   - DayButton onClick handler explicitly adds saved dates to `selectedCleaningDates` when clicked
   - Visual feedback: selected dates get orange border via explicit className

3. **Visual indication:**
   - Selected dates show orange border (`!ring-2 !ring-orange-500`)
   - Saved dates show blue background (via `cleaning` modifier)
   - Dates that are both saved AND selected = blue background + orange border

```typescript
// GOOD: Only user selection in selected prop
selected={selectedCleaningDates}

// onSelect includes all dates (saved or not)
onSelect={(dates) => {
  const allSelected = dates.filter(d => !isDateSaved(d, 'timeoff'));
  setSelectedCleaningDates(allSelected);
}}

// Explicit orange border for selected dates
className={cn(
  isCleaning && "!bg-[#2563eb] !text-white",
  isInSelected && "!ring-2 !ring-orange-500 !ring-offset-2"
)}
```

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Issue 2: Massive Data Corruption - Saving for Wrong Dates

### Problem
When clicking "Mark all X stalls closed", the system saved cleaning schedules for dates the user never selected. For example:
- User selected Feb 23 and Feb 24
- Clicked "Mark all 9 stalls closed" for Clementi
- System created entries for 5+ different dates (Feb 9, Feb 16, Feb 17, Feb 23, Feb 24, etc.)
- Many entries were duplicates or for wrong dates
- User had to delete everything and start over

### Root Cause
The `onSelect` handler was including saved dates in `selectedCleaningDates`. So when the user clicked dates, `selectedCleaningDates` accumulated:
- Dates the user actually clicked
- Previously saved dates that were in the calendar's selection

When saving, the code iterated over ALL dates in `selectedCleaningDates`, including old saved dates, creating duplicate/wrong entries.

```typescript
// BAD: onSelect included saved dates
onSelect={(dates) => {
  // This included saved dates, causing them to be saved again
  const allSelected = dates.filter(d => !isDateSaved(d, 'timeoff'));
  setSelectedCleaningDates(allSelected); // Included saved dates!
}}
```

### Solution
1. **Only track NEW selections:**
   - `selectedCleaningDates` now only contains dates that are NOT already saved
   - Saved dates can be re-selected (via DayButton onClick) to add another location, but they're tracked separately

2. **Save button filters duplicates:**
   - Before saving, filter out dates that already have this location saved
   - Show toast if all selected dates are already saved for this location

3. **Visual feedback:**
   - Added banner showing selected dates: "2 days — 9 Feb, 10 Feb"
   - User can see exactly what will be saved before clicking the button

```typescript
// GOOD: Only new dates in selectedCleaningDates
onSelect={(dates) => {
  const savedDates = getSavedDatesForType('cleaning');
  const savedTimes = new Set(savedDates.map(d => d.getTime()));
  const newSelected = dates.filter(d => {
    if (isDateSaved(d, 'timeoff')) return false;
    return !savedTimes.has(d.getTime()); // Exclude saved dates
  });
  setSelectedCleaningDates(newSelected);
}}

// Save button filters duplicates
const existingDates = new Set(
  savedClosures
    .filter(c => c.type === 'cleaning' && normalizeLocKey(getClosureDisplayLocation(c)) === locKey)
    .map(c => c.date)
);
const newDates = selectedCleaningDates.filter(d => {
  // Only save dates that don't already have this location
  return !existingDates.has(`${year}-${month}-${day}`);
});
```

### Prevention
- Always verify `selectedCleaningDates` only contains dates user actually selected
- Show visual feedback (banner) so user can confirm before saving
- Filter duplicates in save logic as safety net

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Issue 3: Dark Blue Logic Wrong - Counting Stalls Instead of Locations

### Problem
All cleaning dates showed as dark blue (indicating multiple locations), even when only one location was cleaning that day.

### Root Cause
The dark blue logic counted **number of cleaning entries** (one per stall), not **number of distinct locations**. Since saving creates one entry per stall, a single location with 9 stalls = 9 entries = always "multiple" = always dark blue.

```typescript
// BAD: Counted entries, not locations
const cleaningCount = savedClosures.filter(c => c.type === 'cleaning' && c.date === dateStr).length;
const shouldBeDarkBlue = cleaningCount >= 2; // Always true for multi-stall locations!
```

### Solution
Count **distinct locations** instead of total entries:

```typescript
// GOOD: Count distinct locations
const getCleaningLocationCountForDate = (date: Date): number => {
  const dateStr = `${year}-${month}-${day}`;
  const locs = new Set(
    savedClosures
      .filter(c => c.type === 'cleaning' && c.date === dateStr)
      .map(c => normalizeLocKey(getClosureDisplayLocation(c)))
  );
  return locs.size; // Number of distinct locations
};

const shouldBeDarkBlue = cleaningLocCount >= 2; // Only dark blue for 2+ locations
```

### Result
- **Light blue** = 1 location cleaning that day (even if 9 stalls)
- **Dark blue** = 2+ different locations cleaning that day (e.g., Holland Village + Empress Place)

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Lessons Learned

1. **Separate selection state from saved state** - Don't mix saved dates with user's current selection in the same array
2. **Visual feedback is critical** - Show user exactly what will be saved before they click the button
3. **Filter duplicates at save time** - Even if selection logic is correct, always filter duplicates as a safety net
4. **Count entities, not rows** - When grouping/displaying data, count the actual entities (locations) not database rows (stalls)
5. **Test with real data** - The bug only appeared when user had existing saved dates, which is why it wasn't caught earlier

---

## Status

**✅ All Issues Resolved** - February 3, 2026

Cleaning schedule selection now works correctly:
- Can select multiple dates (including saved dates)
- Visual feedback shows selected dates
- Only saves for dates actually selected
- Dark blue only shows for multiple locations (not multiple stalls)

---

# January 14, 2025 - Closure Calendar Feature Fixes

**Date:** January 14, 2025  
**Status:** ✅ All issues resolved

---

## Overview

Building out the Closure feature (tracking when stalls are closed for cleaning or time off) encountered multiple issues related to calendar date handling, state persistence, and UI/UX.

---

## Issue 1: Date Timezone Shift (16th Saving as 15th)

### Problem
When selecting January 16 on the calendar, it would save as January 15 in the database.

### Root Cause
Using `date.toISOString().split('T')[0]` converts the local date to UTC, which in Singapore (UTC+8) can shift the date backwards.

```typescript
// BAD: Shifts date to UTC
date.toISOString().split('T')[0]  // Jan 16 00:00 SGT → Jan 15 16:00 UTC
```

### Solution
Use local date methods instead of ISO string:

```typescript
// GOOD: Keeps local date
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`;
```

Applied to both:
- Saving closures to database
- Parsing saved dates for display on calendar

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Issue 2: Calendar Dates Not Persisting

### Problem
Selected closure dates would disappear when:
- Navigating to another tab/page
- After clicking save

### Root Cause
Dates were only stored in React state, not fetched from the database. After saving, the state was cleared.

### Solution
1. **Fetch saved closures on screen load:**
```typescript
useEffect(() => {
  if (closureStep === 'cleaning' || closureStep === 'timeoff') {
    getClosureSchedules()
      .then(closures => setSavedClosures(closures))
      .catch(err => console.error('Failed to fetch closures:', err));
  }
}, [closureStep]);
```

2. **Display saved dates on calendar:**
```typescript
selected={[...getSavedDatesForType('cleaning'), ...selectedCleaningDates]}
```

3. **Refetch after saving:**
```typescript
await createClosureSchedules(schedules);
const updated = await getClosureSchedules();
setSavedClosures(updated);
```

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Issue 3: Saved Dates Could Be Deselected

### Problem
Users could click on already-saved closure dates and deselect them, which was confusing (it didn't delete them from database).

### Solution
Filter out saved dates from the selection handler:

```typescript
onSelect={(dates) => {
  if (!dates) {
    setSelectedCleaningDates([]);
    return;
  }
  // Only keep newly selected dates, not saved ones
  const newDates = dates.filter(d => 
    !isDateSaved(d, 'cleaning') && !isDateSaved(d, 'timeoff')
  );
  setSelectedCleaningDates(newDates);
}}
```

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Issue 4: Cleaning and Time Off Calendars Not Synced

### Problem
Cleaning and Time Off are both "closure" types but used separate calendars. Dates saved in one didn't show in the other.

### Solution
Both calendars now show ALL closure dates:
- Current type's dates: Fully highlighted, can't be deselected
- Other type's dates: Different color, disabled (can't be selected)

```typescript
// In Cleaning calendar, show Time Off dates as disabled
disabled={(date) => isDateSaved(date, 'timeoff')}
modifiers={{
  timeoff: getSavedDatesForType('timeoff')
}}
modifiersStyles={{
  timeoff: { 
    backgroundColor: '#f59e0b', 
    color: '#ffffff',
    opacity: 0.8
  }
}}
```

### Color Coding
- **Blue** = Cleaning dates
- **Amber/Orange** = Time Off dates

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Issue 5: Location Input Sides Cut Off

### Problem
The location input field had its left and right edges slightly clipped when clicking into/focusing the text box. When not focused, it looked fine, but when active/focused, the sides appeared to be cut off.

### Previous Attempted Fix (January 14, 2025)
We attempted to fix this by removing the `ScrollArea` component that had `-mx-4 px-4` classes and replacing it with simpler `overflow-y-auto`:

```typescript
// Attempted fix (didn't actually solve the issue)
// Before
<ScrollArea className="flex-1 -mx-4 px-4">

// After
<div className="flex-1 flex flex-col space-y-4 pb-8 overflow-y-auto">
```

However, this didn't actually fix the visual clipping issue that appeared when the input was focused.

### Root Cause
The input field container had padding that didn't match the alignment of other elements (like "Scheduled Closures" and "Past closures" sections), causing the sides to appear cut off when the input was focused/active.

### Solution
**Fixed February 3, 2026:** Pulled the location input inwards by adjusting its container padding to align with other calendar elements. The text box was shortened/adjusted to prevent the sides from being cut off when focused.

### Files Changed
- `client/src/pages/add-details.tsx`

**Note:** This issue was initially documented on January 14, 2025 with an attempted fix, but was actually resolved on February 3, 2026.

---

## Issue 6: Food Item Not Being Saved with Closure

### Problem
User selected a food item (e.g., "Duck Rice") for the closure, but it wasn't being saved to the database.

### Root Cause
The `createClosureSchedules` call wasn't including `foodItemId` and `foodItemName`.

### Solution
1. **Added columns to schema:**
```typescript
export const closureSchedules = pgTable("closure_schedules", {
  // ... existing fields
  foodItemId: text("food_item_id"),
  foodItemName: text("food_item_name"),
});
```

2. **Updated save call:**
```typescript
const schedules = selectedCleaningDates.map(date => ({
  type: 'cleaning' as const,
  date: `${year}-${month}-${day}`,
  location: cleaningLocation.trim(),
  foodItemId: selectedClosureFoodItem?.id,
  foodItemName: selectedClosureFoodItem?.name
}));
```

3. **Created migration:**
```sql
ALTER TABLE closure_schedules 
ADD COLUMN IF NOT EXISTS food_item_id TEXT;

ALTER TABLE closure_schedules 
ADD COLUMN IF NOT EXISTS food_item_name TEXT;
```

### Files Changed
- `shared/schema.ts`
- `client/src/lib/api.ts`
- `client/src/pages/add-details.tsx`
- `server/migrations/004_add_food_item_to_closures.sql`

---

## Issue 7: Today's Highlight Clashing with Time Off Color

### Problem
The calendar's "today" highlight was similar yellow to Time Off dates, making it hard to distinguish.

### Solution
Removed the today background highlight, keeping only the text color difference:

```typescript
modifiersStyles={{
  // ... other modifiers
  today: {
    backgroundColor: 'transparent',
    fontWeight: 'normal'
  }
}}
```

### Files Changed
- `client/src/pages/add-details.tsx`

---

## Lessons Learned

1. **Always use local date methods in Singapore timezone** - Never use `toISOString()` for date-only values as it converts to UTC

2. **Persist calendar state to database** - Don't rely solely on React state for data that should survive navigation

3. **Show all related data on same calendar** - Cleaning and Time Off are both "closures" so should be visible together

4. **Provide visual feedback for saved vs unsaved** - Saved dates should look different and not be toggleable

5. **Show context for data** - A colored date is meaningless without knowing which food item it refers to

---

## Migration Required

Run this SQL on Neon to add food item columns:

```sql
ALTER TABLE closure_schedules 
ADD COLUMN IF NOT EXISTS food_item_id TEXT;

ALTER TABLE closure_schedules 
ADD COLUMN IF NOT EXISTS food_item_name TEXT;
```

---

## Status

**✅ All Issues Resolved** - January 14, 2025

Closure calendar feature now working with:
- Correct date handling (no timezone shift)
- Persistent saved dates
- Synced Cleaning/Time Off calendars
- Food item association
- Proper UI styling

---

# December 23, 2024 - Category System Fix

**Date:** December 23, 2024  
**Status:** ✅ All issues resolved

---

## Issue: Category Changes Not Reflecting in Decide Page

### Problem
User changed an "Out" item's category from "Ethnic" to "Light" in the edit page. The dropdown and tag showed "Light" correctly, but when navigating to Decide > Out > Food > Light, the item didn't appear there.

### Root Cause (Multiple Issues)

**1. `handleSelectCategory()` never saved to database**
```typescript
// BUG: Just showed toast, never saved!
function handleSelectCategory(categoryName: string) {
  toast({ title: "Category Updated" });  // Lies!
  setIsChangeCategoryDialogOpen(false);
  // Missing: updateItem() call
}
```

**2. `decide.tsx` ignored saved category**
```typescript
// BUG: Always auto-categorized, ignored user's manual selection
foodCategory: categorizeFood(item.name)  // ❌ Ignored item.category!
```

**3. Form reset race condition**
The `useEffect` watching `items` would reset the form whenever the items array changed, overwriting user's category selection before they could save.

### Solution

**Fix 1: Actually save category to database (`add-details.tsx`)**
```typescript
async function handleSelectCategory(categoryName: string) {
  if (!selectedItem) return;
  try {
    await updateItem(selectedItem.id, { category: categoryName });
    setSelectedItem({ ...selectedItem, category: categoryName });
    toast({ title: "Category Updated", description: `Set to ${categoryName}` });
  } catch (error) {
    toast({ title: "Error", variant: "destructive" });
  }
  setIsChangeCategoryDialogOpen(false);
}
```

**Fix 2: Use saved category in Decide page (`decide.tsx`)**
```typescript
foodCategory: (item.category && ['Noodles', 'Rice', 'Ethnic', 'Light', 'Western'].includes(item.category)) 
  ? (item.category as FoodCategory) 
  : categorizeFood(item.name)
```

**Fix 3: Prevent form reset race condition (`add-details.tsx`)**
```typescript
// Only update selectedItem when ID changes, not on every items update
const lastSelectedIdRef = useRef<string | null>(null);
useEffect(() => {
  if (selectedItem && selectedItem.id !== lastSelectedIdRef.current) {
    lastSelectedIdRef.current = selectedItem.id;
    form.reset({ ... });
  }
}, [selectedItem, form]);
```

### Files Changed
- `client/src/pages/add-details.tsx` - Fixed category saving and form reset
- `client/src/pages/decide.tsx` - Fixed category filtering
- `docs/Project Architecture.md` - Documented category flow

### Verification
- ✅ Category selection saves to database
- ✅ Changed category shows in Decide page filter
- ✅ Form doesn't reset while editing
- ✅ Category persists after page refresh

### Lesson Learned
**Categories are connected across pages.** When implementing category changes:
1. Save to database immediately
2. Update local state for instant feedback
3. All pages displaying categories must check saved category first
4. Document the category flow in architecture docs

---

# December 19, 2024 - Fixes & Solutions

**Date:** December 19, 2024  
**Status:** ✅ All issues resolved

---

## Issues Fixed Today

### 1. Location History Not Persisting
### 2. Test Data Cluttering Archives
### 3. Location Input Requiring Repetitive Typing
### 4. Inconsistent Text Capitalization

---

## 1. Location History Not Persisting

### Problem
Users had to type location names repeatedly (e.g., "Maxwell") every time they added a new food item, even if they had just used that location.

### Root Cause
No system existed to track previously entered locations for quick reuse.

### Solution
Created a new custom hook: `client/src/hooks/use-saved-locations.ts`

**Implementation:**
- Stores up to 50 most recent locations in localStorage
- Provides filtered autocomplete based on user input
- Uses MRU (Most Recently Used) pattern - newest locations appear first
- Case-insensitive duplicate prevention

**Key Code:**
```typescript
const saveLocation = useCallback((location: string) => {
  setSavedLocations(prev => {
    const filtered = prev.filter(loc => 
      loc.toLowerCase() !== trimmed.toLowerCase()
    );
    const updated = [trimmed, ...filtered];
    const limited = updated.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    return limited;
  });
}, []);
```

### Verification
- ✅ Locations saved to localStorage after entry
- ✅ Recent locations appear first in suggestions
- ✅ Duplicates prevented (case-insensitive)
- ✅ History persists across sessions
- ✅ Autocomplete filters as user types

### Files Changed
- Created: `client/src/hooks/use-saved-locations.ts`
- Modified: `client/src/pages/add-details.tsx` (integrated the hook)

---

## 2. Test Data Cluttering Archives

### Problem
During development and testing, test items marked as "thrown away" accumulated in the Food Wasted archive. No way existed to remove them without affecting real data.

### Root Cause
Archive deletion was not implemented, as it wasn't needed for real data but became problematic during development.

### Solution
Added conditional delete button for test items in the Food Wasted page.

**Detection Logic:**
```typescript
const isTestItem = archivedItem.name.toLowerCase().includes('test');
```

**Implementation:**
```typescript
{isTestItem && (
  <Button
    variant="ghost"
    size="icon"
    onClick={async () => {
      try {
        await deleteArchivedItem(archivedItem.id);
      } catch (error) {
        console.error("Failed to delete archived item:", error);
      }
    }}
  >
    <Trash2 size={16} />
  </Button>
)}
```

### Benefits
1. **Non-destructive for real data:** Real items can't be accidentally deleted
2. **Developer-friendly:** Easy to clean up test data
3. **Simple heuristic:** Any item with "test" in name is deletable
4. **No admin panel needed:** Keeps codebase simple

### Verification
- ✅ Delete button only appears for items with "test" in name
- ✅ Delete operation works (removes from archive)
- ✅ Error handling prevents crashes
- ✅ Real food items remain protected

### Files Changed
- `client/src/pages/food-wasted.tsx`

---

## 3. Location Input Requiring Repetitive Typing

### Problem
Adding multiple foods from the same location (e.g., 5 dishes from "Maxwell") required typing "Maxwell" five times. No autocomplete or suggestions available.

### Root Cause
Location input was a plain text field with no memory of previous entries.

### Solution
Integrated saved locations hook with autocomplete dropdown in the add-details page.

**Features Added:**
1. Dropdown shows top 10 most recent locations when field is focused
2. Filters locations as user types
3. Click location in dropdown to autofill
4. Still allows typing new locations freely

**Integration Pattern:**
```typescript
const { saveLocation: saveLocationToHistory, getFilteredLocations } = useSavedLocations();

// On save
saveLocationToHistory(capitalizedLocationName);

// For autocomplete (when implemented)
const suggestions = getFilteredLocations(currentInput);
```

### Verification
- ✅ Locations saved when user creates/edits location
- ✅ Most recent locations shown first
- ✅ Can still type new locations
- ✅ History persists across sessions

### Files Changed
- `client/src/pages/add-details.tsx`
- `client/src/hooks/use-saved-locations.ts`

---

## 4. Inconsistent Text Capitalization

### Problem
Food names and locations entered as lowercase (e.g., "maxwell", "chicken rice") looked unprofessional and created duplicate entries due to case differences.

### Root Cause
No automatic capitalization applied to user input.

### Solution
Implemented `capitalizeWords` utility with application at two points:

**1. On Blur (immediate feedback):**
```typescript
onBlur={(e) => {
  const capitalized = capitalizeWords(e.target.value);
  field.onChange(capitalized);
}}
```

**2. On Save (safety net):**
```typescript
const capitalizedName = capitalizeWords(values.name.trim());
```

### Why This Approach
- **Non-intrusive:** Doesn't capitalize while user is typing (would be jarring)
- **Consistent:** Ensures all saved data is properly capitalized
- **Duplicate prevention:** "maxwell" and "Maxwell" normalized to same format
- **Professional appearance:** All food names and locations look polished

### Verification
- ✅ Text capitalizes when user leaves field (blur)
- ✅ Text capitalizes on form submit if blur didn't fire
- ✅ Whitespace trimmed before capitalization
- ✅ Applies to food names and location names

### Files Changed
- `client/src/pages/add-details.tsx`
- Uses existing `capitalizeWords` from `client/src/lib/utils.ts`

---

## Other Improvements Made

### A. Migration File Added
Created initial database migration for categories:
- File: `server/migrations/001_add_categories.sql`
- Purpose: Database schema versioning foundation

### B. Documentation Updates
Updated existing documentation:
- `docs/Health_Endpoint_503_Fixes.md` - Minor clarifications
- `docs/List_Page_Checkmark_Visibility_Fix.md` - Formatting improvements
- `mobile/EXPO_GO_STARTUP.md` - Updated troubleshooting steps

---

## Common Patterns Used

### 1. Defensive Programming with Try-Catch
```typescript
try {
  localStorage.setItem(key, value);
} catch (error) {
  console.error('Failed to save:', error);
  // App continues working without localStorage
}
```

### 2. Double Validation Pattern
Apply transformations at multiple points to ensure consistency:
- On blur (user feedback)
- On form submit (safety net)
- On data save (final guarantee)

### 3. Case-Insensitive Comparisons
```typescript
const filtered = prev.filter(loc => 
  loc.toLowerCase() !== trimmed.toLowerCase()
);
```
Always normalize case for comparisons while preserving user's capitalization preference.

### 4. Conditional Feature Flags
```typescript
const isTestItem = item.name.toLowerCase().includes('test');
{isTestItem && <DeleteButton />}
```
Simple heuristics for development-only features without complex admin systems.

---

## Testing Performed

### Manual Testing Checklist
- [x] Add location, verify it appears in history
- [x] Add same location (different case), verify no duplicate
- [x] Close app, reopen, verify history persists
- [x] Type location name, verify autocomplete filters
- [x] Create test item, archive it, verify delete button appears
- [x] Delete test item from archive, verify removal
- [x] Enter lowercase food name, verify capitalizes on blur
- [x] Enter lowercase location, verify capitalizes on save
- [x] Add multiple items from same location quickly

### Results
✅ All tests passed

---

## Lessons Learned

1. **LocalStorage Persistence:** Perfect for user preferences and recent history that should survive page refreshes but doesn't need server backup

2. **MRU Pattern:** For location/place suggestions, most recent first provides best UX because users often batch-add items from same location

3. **Capitalize on Blur, Not onChange:** Formatting text as user types creates poor UX. Wait until they're done (blur event).

4. **Simple Test Data Detection:** Checking for "test" in the name is sufficient for development cleanup without building complex admin features

5. **Case-Insensitive Deduplication:** Always normalize case when comparing text that represents the same entity (places, names, etc.)

---

## Related Files

### Created
- `client/src/hooks/use-saved-locations.ts`
- `server/migrations/001_add_categories.sql`

### Modified
- `client/src/pages/add-details.tsx`
- `client/src/pages/food-wasted.tsx`
- `client/src/pages/decide.tsx`
- `docs/Health_Endpoint_503_Fixes.md`
- `docs/List_Page_Checkmark_Visibility_Fix.md`
- `mobile/EXPO_GO_STARTUP.md`

---

## Status

**✅ All Issues Resolved** - December 19, 2024

All fixes tested and working as expected. No known issues remaining from today's work.

---

## Related Documentation

- [Architecture & Design Patterns](./Architecture_and_Patterns.md) - How the website works
- [Health Endpoint 503 Fixes](./Health_Endpoint_503_Fixes.md) - Server cold start issues
- [List Page Checkmark Fix](./List_Page_Checkmark_Visibility_Fix.md) - Layout issues
- [Expo Go Troubleshooting](./Loading_on_Expo_Go_Troubleshooting.md) - Mobile app issues

