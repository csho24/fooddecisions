# Food Compass - Architecture & Design Patterns

This document explains how the Food Compass website works, covering architectural decisions, design patterns, and key implementation strategies.

**Last Updated:** December 19, 2024

---

## Table of Contents

1. [Saved Locations System](#1-saved-locations-system)
2. [Automatic Text Capitalization](#2-automatic-text-capitalization)
3. [Food Categorization System](#3-food-categorization-system)
4. [Location Management](#4-location-management)
5. [State Management](#5-state-management)
6. [Form Validation](#6-form-validation)
7. [UI/UX Patterns](#7-uiux-patterns)
8. [Mobile-First Design](#8-mobile-first-design)

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

#### B. "Out" Food Categories (Automatic)
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
- Auto-categorized based on food name
- Used in Decide page to help filter restaurant options
- Categories represent cuisine/dish types

### Why Two Systems?

**Home vs Out are fundamentally different:**
- **Home** = storage location (fridge, pantry, snacks) - user knows best
- **Out** = food type (noodles, rice, western) - can be inferred from name

**Decision rationale:**
1. Can't intelligently guess if something belongs in Fridge vs Snacks
2. CAN intelligently guess "laksa" → Noodles or "burger" → Western
3. Manual categories are simple with few options (2 categories)
4. Auto categories provide convenience without requiring user input

### Auto-Categorization Strategy

**Rule-based keyword matching:**
```typescript
if (lower.includes('noodle') || lower.includes('mee') || lower.includes('laksa'))
  return "Noodles";
```

**Benefits:**
- Simple and fast
- Works well for common food names
- Easy to expand with more keywords
- Provides immediate value without ML complexity

**Principle:** Keep category lists small (5 categories) for faster decision-making.

---

## 4. Location Management

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

## 5. State Management

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

## 6. Form Validation

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

## 7. UI/UX Patterns

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

## 8. Mobile-First Design

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

## Related Documentation

- [December 19 Fixes & Solutions](./Dec_19_Fixes_and_Solutions.md) - Specific problems solved
- [Health Endpoint 503 Fixes](./Health_Endpoint_503_Fixes.md) - Server cold start issues
- [List Page Checkmark Fix](./List_Page_Checkmark_Visibility_Fix.md) - Flexbox layout issues
- [Expo Go Troubleshooting](./Loading_on_Expo_Go_Troubleshooting.md) - Mobile app loading
- [Neon & Render Integration](./Neon_Render_Integration.md) - Database and hosting

---

**Document Purpose:** Reference for understanding how the Food Compass app is architected and why design decisions were made.

