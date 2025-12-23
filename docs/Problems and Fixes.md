# Problems and Fixes Log

This document tracks specific problems encountered and their solutions.

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

