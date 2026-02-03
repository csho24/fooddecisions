# Problems and Fixes Log

This document tracks specific problems encountered and their solutions across the application.

---

# February 3, 2026 - Location Duplication Due to Capitalization

**Date:** February 3, 2026  
**Status:** ✅ All issues resolved

---

## Problem

Locations with the same spelling but different capitalization were being treated as separate locations throughout the application. For example:
- "Margaret Drive" and "Margaret drive" appeared as two different locations
- "Clementi" and "clementi" created duplicate entries
- Dropdowns showed the same location multiple times
- Tooltips displayed duplicates like "Margaret Drive, Margaret Drive"
- Closure schedules grouped incorrectly

This caused confusion and data inconsistency across:
- Location dropdowns in Decide page
- Closure schedule tooltips
- Location autocomplete/datalist
- Home page closure notifications
- Food item location lists

## Root Cause

The application was storing and comparing location names without normalizing capitalization. When users entered locations with different capitalization (e.g., "margaret drive" vs "Margaret Drive"), they were saved as separate entries because string comparisons are case-sensitive.

## Solution

Implemented consistent location normalization throughout the application:

### 1. Normalization Function
```typescript
const normalizeLocKey = (s: string) => s.trim().toLowerCase();
```
Used for all location comparisons to treat "Margaret Drive" and "Margaret drive" as the same.

### 2. Capitalization Function
```typescript
import { capitalizeWords } from "@/lib/utils";
// "margaret drive" → "Margaret Drive"
```
Applied when saving locations to ensure consistent storage format.

### 3. Changes Made

**Location Saving (`add-details.tsx`):**
- `saveLocation()` now checks for existing locations by normalized key before adding
- If duplicate found (different capitalization), updates existing entry instead of creating new one
- All new locations are capitalized with `capitalizeWords()` before saving

**Location Display (`add-details.tsx`):**
- `getClosureDisplayLocation()` always returns capitalized locations
- Tooltip grouping uses `normalizeLocKey()` to group locations, then displays capitalized version
- Datalist for cleaning locations normalizes and capitalizes all entries

**Decide Page (`decide.tsx`):**
- `uniqueLocations` uses normalized keys to prevent duplicates
- All displayed locations are capitalized consistently

**Home Page (`home.tsx`):**
- Closure banner groups locations by normalized key
- Prevents duplicate notifications for same location with different capitalization

**Saved Locations Hook (`use-saved-locations.ts`):**
- Already used case-insensitive comparison (no changes needed)

### 4. Example Fix

**Before:**
- User adds "Margaret Drive" → saved as "Margaret Drive"
- User adds "Margaret drive" → saved as "Margaret drive" (duplicate!)
- Dropdown shows: "Margaret Drive", "Margaret drive"
- Tooltip shows: "Margaret Drive, Margaret drive"

**After:**
- User adds "Margaret Drive" → saved as "Margaret Drive"
- User adds "Margaret drive" → updates existing "Margaret Drive" entry
- Dropdown shows: "Margaret Drive" (once)
- Tooltip shows: "Margaret Drive"

## Files Changed

- `client/src/pages/add-details.tsx` - Location saving, display, and tooltip grouping
- `client/src/pages/decide.tsx` - Unique locations list
- `client/src/pages/home.tsx` - Closure notification grouping
- `client/src/hooks/use-saved-locations.ts` - Already normalized (no changes)

## Prevention

Going forward, all location operations:
1. **Normalize** using `normalizeLocKey()` for comparisons
2. **Capitalize** using `capitalizeWords()` for storage/display
3. **Check for duplicates** before adding new locations

## Lessons Learned

1. **Always normalize user input** - Case-insensitive comparisons prevent duplicates
2. **Consistent capitalization** - Store data in a standardized format
3. **Check before adding** - Prevent duplicates at the source, not just in display
4. **Apply everywhere** - Normalization must be consistent across all location operations

---

## Status

**✅ All Issues Resolved** - February 3, 2026

Location duplication due to capitalization is now prevented throughout the application. All new locations are normalized and capitalized consistently.

---
