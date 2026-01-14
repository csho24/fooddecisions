# Food Compass - Architecture & Design Patterns

This document explains how the Food Compass website works, covering architectural decisions, design patterns, and key implementation strategies.

**Last Updated:** January 14, 2026

---

## Table of Contents

1. [Saved Locations System](#1-saved-locations-system)
2. [Automatic Text Capitalization](#2-automatic-text-capitalization)
3. [Food Categorization System](#3-food-categorization-system)
4. [Closure Schedule System](#4-closure-schedule-system)
5. [Location Management](#5-location-management)
6. [State Management](#6-state-management)
7. [Form Validation](#7-form-validation)
8. [UI/UX Patterns](#8-uiux-patterns)
9. [Mobile-First Design](#9-mobile-first-design)

---

## 1. Saved Locations System

### Purpose
Reusable hook that tracks previously entered locations to reduce repetitive typing and speed up data entry.

### Implementation: `client/src/hooks/use-saved-locations.ts`

### Key Features

#### A. Most Recent on Top (MRU Pattern)
```typescript
const saveLocation = useCallback((location: string) => {
  setSavedLocations(prev => {
    // Remove if exists, then add to front
    const filtered = prev.filter(loc => loc.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered];
    return limited;
  });
}, []);
```

**Why:** Users typically add multiple items from the same location in one session, so most recent locations are most relevant.

#### B. Case-Insensitive Duplicate Prevention
- Compares using `.toLowerCase()` to prevent "Maxwell", "maxwell", and "MAXWELL" from all being saved
- Preserves the user's latest capitalization choice

#### C. Smart Filtering for Autocomplete
```typescript
const getFilteredLocations = useCallback((query: string): string[] => {
  if (!query) return savedLocations.slice(0, 10); // Show top 10 when no query
  
  const lowerQuery = query.toLowerCase();
  return savedLocations.filter(loc => 
    loc.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}, [savedLocations]);
```

**Benefits:**
- Limits results to 10 items to avoid overwhelming the UI
- Shows most recent when no query (common locations)
- Filters as user types for quick access

#### D. Storage Management
- Capped at 50 items to prevent localStorage from growing indefinitely
- Try-catch blocks around localStorage operations for defensive programming
- Continues working even if localStorage fails (quota exceeded, privacy mode, etc.)

### Design Principles

1. **MRU (Most Recently Used) Pattern:** Creates a natural "favorites" list over time
2. **Case-Insensitive Comparisons:** Normalizes case for comparisons while preserving display preferences
3. **Defensive localStorage:** App continues working if localStorage fails
4. **Smart Limits:** 50 items balances usefulness with performance

---

## 2. Automatic Text Capitalization

### Pattern Used Throughout App

```typescript
import { capitalizeWords } from "@/lib/utils";

// On blur event
onBlur={(e) => {
  const capitalized = capitalizeWords(e.target.value);
  field.onChange(capitalized);
}}

// On save (safety net)
const capitalizedName = capitalizeWords(values.name.trim());
```

**Applied to:**
- Food item names (`add-details.tsx`)
- Location names (`add-details.tsx`)

### Why This Approach

1. **On Blur, Not On Change:** Capitalizing as the user types is jarring. Capitalizing on blur (when they leave the field) respects typing flow.

2. **Double Protection:** Capitalizing both on blur AND on save ensures consistency even if blur doesn't fire (e.g., form submitted via Enter key).

3. **Trim Before Capitalize:** Always trim whitespace to avoid "  maxwell  " becoming "  Maxwell  ".

### Benefits

- **Consistency:** Prevents "maxwell" and "Maxwell" from being treated as different locations
- **Professional appearance:** All food names and locations are properly capitalized
- **Non-intrusive:** Users can type freely without automatic corrections interfering

---

## 3. Food Categorization System

### Two-Level Category System

The app uses different category strategies for home vs out items:

#### A. Home Food Categories (Manual Selection)
```typescript
const HOME_CATEGORIES = [
  "Fridge",
  "Snacks"
];
```
- Simple, user-selected categories
- Stored in `item.category` field
- Represents storage location in the home

#### B. "Out" Food Categories (Manual Override + Auto-Fallback)
```typescript
// From food-categories.ts
export type FoodCategory = 
  | "Noodles" 
  | "Rice" 
  | "Ethnic" 
  | "Light" 
  | "Western";

export function categorizeFood(foodName: string): FoodCategory {
  const lower = foodName.toLowerCase();
  // Rule-based categorization with keywords...
}
```
- **Saved category takes priority** - if user manually sets category, use it
- Auto-categorizes based on food name as fallback
- Used in Decide page to help filter restaurant options
- Categories represent cuisine/dish types

### CRITICAL: Category Flow Across Pages

**Categories must be consistent across all pages:**

| Page | How Categories Work |
|------|---------------------|
| `add-details.tsx` | User can manually change category via dialog. Saves to `item.category` in database. |
| `decide.tsx` | Must check `item.category` first. Only use `categorizeFood()` as fallback if no saved category. |
| `list.tsx` | Displays saved category badge if exists. |

**Implementation Pattern (Dec 23, 2024 fix):**
```typescript
// CORRECT - Check saved category first, then fallback to auto
const foodCategory = item.category && ['Noodles', 'Rice', 'Ethnic', 'Light', 'Western'].includes(item.category)
  ? item.category as FoodCategory
  : categorizeFood(item.name);

// WRONG - Always auto-categorizing ignores user's manual override
const foodCategory = categorizeFood(item.name);  // ❌ Don't do this!
```

### Why Two Systems?

**Home vs Out are fundamentally different:**
- **Home** = storage location (fridge, pantry, snacks) - user knows best
- **Out** = food type (noodles, rice, western) - can be inferred from name, but user can override

**Decision rationale:**
1. Can't intelligently guess if something belongs in Fridge vs Snacks
2. CAN intelligently guess "laksa" → Noodles or "burger" → Western
3. But user should be able to override if auto-categorization is wrong
4. Manual categories are simple with few options (2 categories for Home)
5. Auto categories provide convenience without requiring user input

### Auto-Categorization Strategy

**Rule-based keyword matching (fallback only):**
```typescript
if (lower.includes('noodle') || lower.includes('mee') || lower.includes('laksa'))
  return "Noodles";
```

**Benefits:**
- Simple and fast
- Works well for common food names
- Easy to expand with more keywords
- Provides immediate value without ML complexity
- User can override if wrong

**Principle:** Keep category lists small (5 categories) for faster decision-making.

---

## 4. Closure Schedule System

Manages eatery closure schedules for cleaning days and time off. Both types share a unified calendar showing all closure dates with food item associations.

### Files
- Web UI: `client/src/pages/add-details.tsx`
- Web Home Banner: `client/src/pages/home.tsx`
- Mobile UI: `mobile/src/screens/AddInfoScreen.tsx`
- Mobile Home Banner: `mobile/src/screens/HomeScreen.tsx`
- Schema: `shared/schema.ts` - `closureSchedules` table
- Storage: `server/storage.ts` - `bulkCreateClosureSchedules()`
- Routes: `server/routes.ts` - `/api/closures`
- Web API: `client/src/lib/api.ts` - `createClosureSchedules()`
- Mobile API: `mobile/src/api.ts` - `createClosureSchedules()`

### Database

**Table:** `closure_schedules`
- `type`: 'cleaning' | 'timeoff'
- `date`: ISO date string (YYYY-MM-DD)
- `location`: Text (e.g., "Ghim Moh")
- `food_item_id`: Text (optional, links to food item)
- `food_item_name`: Text (optional, denormalized for display)
- Indexed on `date` and `type`

### UI Flow

1. Main → "Closure" card
2. Closure → "Cleaning" and "Time Off" cards (no header title, shown as h3 in content)
3. Each opens multi-select calendar
4. Calendar shows saved dates (cleaning=blue, timeoff=amber)
5. After selecting dates, enter location → select matching food item from list
6. Time Off only allows future dates
7. Saves multiple dates in single API call with food item association

### Display Format

**Closure List (Jan 14, 2026):**
```typescript
// Shows "Location › Food" format when both exist
{c.location && c.foodItemName 
  ? `${c.location} › ${c.foodItemName}` 
  : c.foodItemName || c.location}
```

Example: `Ghim Moh › Duck Rice` instead of just `Ghim` or `Duck Rice`

### Home Page Alert Banner

When today has scheduled closures, an alert banner appears on the home page (both web and mobile):

```typescript
// Fetch and filter for today
const todayStr = `${year}-${month}-${day}`;
const todayClosures = closures.filter(c => c.date === todayStr);

// Display banner if closures exist
{todaysClosures.length > 0 && (
  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
    <p className="font-semibold">Closed Today</p>
    {todaysClosures.map(c => (
      <p>{c.location} › {c.foodItemName} ({c.type})</p>
    ))}
  </div>
)}
```

### Implementation

**Food Item Matching:**
```typescript
// Find food items that have a location matching the input
const matchingItems = items.filter(item => 
  item.type === 'out' && 
  item.locations?.some(loc => 
    loc.name.toLowerCase().includes(closureLocation.toLowerCase())
  )
);
```

**Bulk Creation with Food Item:**
```typescript
const schedules = dates.map(date => ({
  type: 'cleaning',
  date: `${year}-${month}-${day}`,
  location: closureLocation.trim(),
  foodItemId: selectedClosureFoodItem?.id,
  foodItemName: selectedClosureFoodItem?.name
}));
await createClosureSchedules(schedules);
```

**Date Restrictions:**
- Cleaning: Any date
- Time Off: `disabled={(date) => date < today}`

### Mobile App Closure Calendar (Jan 14, 2026)

Mobile app now has full calendar functionality matching web:
- Custom calendar grid with month navigation
- Date selection with tap to toggle
- Shows saved cleaning dates in blue, time off in amber
- Location input + food item selection
- Scheduled closures list with "Location › Food" format
- Home screen alert banner for today's closures

---

## 5. Location Management

### File: `client/src/pages/add-details.tsx`

### Architecture

Uses a dialog-based system for adding and editing location details with:
- Single dialog component for both add and edit
- Collapsible sections for optional details (opening hours)
- AlertDialog for delete confirmations
- Integration with saved locations hook

### Key Patterns

#### A. Single Dialog for Add and Edit
```typescript
function handleAddLocation() {
  setEditingLocation(null);  // Clear editing state
  locationForm.reset({ /* defaults */ });
  setIsLocationDialogOpen(true);
}

function handleEditLocation(loc: LocationDetail) {
  setEditingLocation(loc);  // Set editing state
  locationForm.reset({ /* populate with loc data */ });
  setIsLocationDialogOpen(true);
}
```

**Benefits:**
- Reduces code duplication
- Ensures consistent UX between add and edit
- Single source of truth for location form UI

#### B. Optimistic UI Updates
```typescript
function saveLocation(values: z.infer<typeof locationSchema>) {
  // ... save logic ...
  
  updateItem(selectedItem.id, { locations: updatedLocations });
  
  // Update local state for immediate feedback
  setSelectedItem({ ...selectedItem, locations: updatedLocations });
  
  setIsLocationDialogOpen(false);
}
```

**Why:** Updating both store and local state makes UI feel instant rather than waiting for store propagation.

#### C. Two-Step Delete Process
```typescript
// Step 1: Mark for deletion
<Button onClick={() => setLocationToDelete(loc.id)}>
  <Trash2 size={18} />
</Button>

// Step 2: Confirm in AlertDialog
<AlertDialog open={!!locationToDelete}>
  <AlertDialogAction onClick={confirmDeleteLocation}>
    Delete
  </AlertDialogAction>
</AlertDialog>
```

**Benefits:**
- Prevents accidental deletions
- Follows best practices for destructive actions
- Clear communication about what will be deleted

#### D. Progressive Disclosure for Details
Opening hours are hidden behind a toggle to keep the UI simple for basic use cases while supporting power users who need detailed tracking.

---

## 6. State Management

### Strategy: Local State for UI, Store for Data

```typescript
// UI state - component local
const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
const [editingLocation, setEditingLocation] = useState<LocationDetail | null>(null);

// Data state - global store
const { items, addItem, updateItem, removeItem } = useFoodStore();
```

### Separation Principles

| State Type | Storage | Example | Why |
|------------|---------|---------|-----|
| UI State | Component local | Dialog open/closed, current tab | Only relevant to current component |
| Data State | Global store | Food items, locations, archives | Shared across multiple components |
| Form State | React Hook Form | Form field values, validation | Managed by form library |
| Derived State | useMemo | Filtered/sorted lists | Computed from other state |

### Benefits

1. **Performance:** UI state changes don't trigger store updates or re-renders of unrelated components
2. **Locality:** UI concerns stay local to the component that needs them
3. **Simplicity:** Store remains focused on data operations, not UI details
4. **Clear boundaries:** Easy to understand what state affects what

---

## 7. Form Validation

### Using Zod Schemas

```typescript
const locationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Location name is required"),
  hasOpeningHours: z.boolean().default(false),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  closedDays: z.array(z.number()).optional(),
  notes: z.string().optional(),
});
```

### Schema Design Principles

1. **Optional IDs:** Not present when creating new items
2. **Sensible Minimums:** `min(2)` for names prevents single-character mistakes
3. **Optional Detail Fields:** Hours, notes optional to support quick-add workflows
4. **Default Values:** `default(false)` for booleans prevents undefined/null issues
5. **Helpful Messages:** Clear error messages ("Location name is required" vs "Invalid input")

### Pattern: Progressive Disclosure

Match schema's required fields to what's actually essential. Everything else optional to support quick workflows while allowing detailed tracking for power users.

---

## 8. UI/UX Patterns

### Consistent Sizing

#### Button Sizes
- **Primary actions:** `h-14` (56px) - easy thumb tapping
- **Action buttons:** `h-12 w-12` (48px) - checkmarks, icons
- **Secondary actions:** `size="sm"` - less prominent options

#### Border Radius
- **Cards/containers:** `rounded-xl` (12px)
- **Buttons:** `rounded-xl` (12px)  
- **Dialogs/modals:** `rounded-2xl` (16px) - more prominent
- **Small badges:** `rounded` (4px)

### Color Coding

| Color | Usage | Example |
|-------|-------|---------|
| Green | Complete/Done actions | Checkmarks, "ate it" button |
| Red | Destructive actions | Delete, "threw away" button |
| Primary (Blue) | Normal actions | Save, Add, Submit |
| Ghost (Transparent) | Secondary actions | Cancel, Back |

### Touch Target Guidelines

All interactive elements meet the **44x44px minimum** touch target guideline:
- Most buttons use 48px or 56px
- Adequate spacing between clickable elements
- Large hit areas for primary actions

### Visual Feedback

- **Active states:** `active:scale-95` provides haptic-like feedback on tap
- **Hover states:** Desktop users get hover feedback
- **Loading states:** Always show feedback for async operations
- **Disabled states:** Visual indication when actions unavailable

---

## 9. Mobile-First Design

### Touch Interactions

1. **Adequate sizing:** All buttons ≥48px (exceeds 44px minimum)
2. **Spacing:** Prevents accidental mis-taps between elements
3. **Gesture support:** Swipe, scroll work naturally
4. **No hover dependencies:** All features work without hover states

### Scrolling Strategy

```typescript
<ScrollArea className="flex-1">
  <div className="space-y-3 pb-20">
    {/* Content */}
  </div>
</ScrollArea>
```

**Key elements:**
- `ScrollArea` component for consistent scroll behavior
- `pb-20` ensures last items aren't hidden behind bottom navigation
- Proper flex layouts prevent scroll issues

### Responsive Layout

- Mobile-first approach: Design for mobile, enhance for larger screens
- Single column layouts for clarity
- Bottom navigation for easy thumb access
- Full-width buttons for easy tapping

---

## Common Patterns Used Throughout

### 1. Event Propagation Control
```typescript
onClick={(e) => {
  e.stopPropagation();  // Prevent parent handlers
  handleAction();
}}
```
**When:** Button inside a clickable container

### 2. Trim User Input
```typescript
const trimmed = value.trim();
if (!trimmed || trimmed.length < 2) return;
```
**Always:** Before validation and saving

### 3. Form Submit Prevention
```typescript
onKeyDown={(e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleCustomAction();
  }
}}
```
**When:** Want custom Enter behavior in forms

### 4. Conditional Rendering with Safety
```typescript
{item.locations && item.locations.length > 0 && (
  <LocationList locations={item.locations} />
)}
```
**Always:** Check existence before checking length

### 5. Form Reuse for Add/Edit
Single form component with conditional logic based on whether editing existing item or creating new one.

---

## Technology Stack

- **Frontend Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight React router)
- **State Management:** Zustand (global store)
- **Form Management:** React Hook Form + Zod validation
- **UI Components:** shadcn/ui (Radix UI + Tailwind)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Backend:** Express.js + Node.js
- **Database:** PostgreSQL (Neon)
- **Hosting:** Render.com
- **Mobile:** Expo Go (development)

---

## File Structure

```
client/src/
├── components/          # Reusable UI components
│   ├── mobile-layout.tsx
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
│   ├── use-saved-locations.ts
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/                # Utility functions and configuration
│   ├── store.ts        # Zustand global state
│   ├── food-categories.ts
│   ├── utils.ts
│   └── api.ts
├── pages/              # Route components
│   ├── home.tsx
│   ├── list.tsx
│   ├── add-details.tsx
│   ├── decide.tsx
│   └── food-wasted.tsx
└── main.tsx            # App entry point
```

---

## UI Guidelines & Rules

### Back Button Rule - NEVER HAVE TWO BACK BUTTONS

**Problem:** When adding inline "← Back" buttons in nested flows, they duplicate the header back button from the Layout component.

**Solution:** Use the Layout's `onBack` prop to handle context-aware back navigation:

```tsx
<Layout showBack title={getTitle()} onBack={handleBack}>
```

The `handleBack` function should check the current step/state and navigate backwards within the flow, only going to "/" when at the top level.

**DO NOT:**
- Add inline `← Back` buttons when `showBack` is true on Layout
- Have two visible back buttons on any screen

**DO:**
- Use `onBack` prop to customize back behavior
- Update the title dynamically based on current step

---

### Sub-descriptions on Buttons - DO NOT ADD WITHOUT ASKING

**DO NOT add sub-description text under button labels** like:
```tsx
// ❌ DON'T DO THIS
<span>Cleaning</span>
<span className="text-xs text-muted-foreground">Select cleaning days</span>
```

**Only the main label is needed:**
```tsx
// ✅ DO THIS
<span>Cleaning</span>
```

Sub-descriptions are ONLY allowed when the user explicitly provides them.

---

### Avoid Repetitive Titles (Jan 14, 2026)

When a screen has a title shown in the content (e.g., as an `<h3>`), don't also show it in the header next to the back button.

```tsx
// ❌ DON'T: Title in header AND in content
<Layout showBack title="Cleaning">
  <h3>Cleaning Days</h3>  // Repetitive!
</Layout>

// ✅ DO: Title only in content, empty header
const getTitle = () => {
  if (closureStep === 'cleaning') return '';  // No header title
  if (closureStep === 'timeoff') return '';
  return 'Add Info';
};

<Layout showBack title={getTitle()}>
  <h3>Cleaning Days</h3>  // Only here
</Layout>
```

---

## Database Migrations - MUST RUN SQL MANUALLY

When adding new database columns, the SQL must be run manually in Neon console.

### Expiry Date Column (Dec 20, 2024)
```sql
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS expiry_date TEXT;
```

### Food Item Columns in Closures (Jan 14, 2026)
```sql
ALTER TABLE closure_schedules ADD COLUMN IF NOT EXISTS food_item_id TEXT;
ALTER TABLE closure_schedules ADD COLUMN IF NOT EXISTS food_item_name TEXT;
```

### All Required Tables
```sql
-- Food Items table
CREATE TABLE IF NOT EXISTS food_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  notes TEXT,
  expiry_date TEXT,
  locations JSONB
);

-- Archived Items table  
CREATE TABLE IF NOT EXISTS archived_items (
  id SERIAL PRIMARY KEY,
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL,
  archived_at TEXT NOT NULL
);

-- Closure Schedules table
CREATE TABLE IF NOT EXISTS closure_schedules (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT,
  food_item_id TEXT,
  food_item_name TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);
```

**IMPORTANT:** After updating `shared/schema.ts`, YOU MUST run the SQL in Neon console. The migration files in `server/migrations/` are reference only - they don't auto-run.

---

## Related Documentation

- [December 19 Fixes & Solutions](./Dec_19_Fixes_and_Solutions.md) - Specific problems solved
- [Health Endpoint 503 Fixes](./Health_Endpoint_503_Fixes.md) - Server cold start issues
- [List Page Checkmark Fix](./List_Page_Checkmark_Visibility_Fix.md) - Flexbox layout issues
- [Expo Go Troubleshooting](./Loading_on_Expo_Go_Troubleshooting.md) - Mobile app loading
- [Neon & Render Integration](./Neon_Render_Integration.md) - Database and hosting

---

**Document Purpose:** Reference for understanding how the Food Compass app is architected and why design decisions were made.

