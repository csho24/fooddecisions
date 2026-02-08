# User Experience — How the App Works

Plain-English description of the whole app: what each part is for and how people use it.

---

## Adding food (for now)

**All food is added in Food List, not in Add Info.**  
You add items (name, Home or Out, and for Out a location) via **Quick Add** on the Food List page. Add Info is for editing existing items, closure schedules, and expiry — not for creating new food entries.

---

## Home

- **Tagline:** “What and where shall we eat today?”
- **Decide** — “Help me choose what to eat” → takes you to the Decide flow (pick Home or Out, then choose something).
- **Food List** — Your lists: Home (fridge/snacks) and Out (eateries/stalls). Quick Add and all item management live here.
- **Add Info** — Closure schedules (when stalls are closed for cleaning or time off), expiry dates for home items, and editing an item’s details (name, category, locations, opening hours, closed days).
- If any stall is **closed today** (from closure schedules), a banner appears at the top (e.g. “1 Ghim Moh stall closed today”).

---

## Food List

- **Tabs:** **Home** (fridge, snacks) and **Out** (eateries, stalls).
- **Quick Add** — Add a new item: name, type (Home / Out). For Out you add at least one location; for Home you can set category (e.g. Fridge, Snacks). Locations you’ve used before are suggested.
- Each item can be:
  - **Checked** → “Ate it” (archived as eaten), or  
  - **Thrown** → “Threw it away” (archived as thrown).
- **Tap an item** → opens **Add Info** to edit that item (name, category, locations, opening hours, closed days).
- **Food Wasted** is reached from this page (e.g. via the “Food Wasted” stats) and shows items you threw away.

---

## Add Info

You get here in two ways:

1. **From Home (no item selected)**  
   You see two options:
   - **Closure** — When stalls are closed (cleaning or time off). Then choose **Cleaning** or **Time off**, pick dates on the calendar, enter location, link to a food item, and save. On the calendar: **cleaning at different locations on the same day** shows as **darker blue**; a **half blue / half amber** day means there’s both cleaning and time off on that day. See [Calendar_How_It_Works.md](./Calendar_How_It_Works.md) for full calendar behaviour.
   - **Expiry** — Set or edit expiry dates for home (Fridge/Snacks) items.

2. **From Food List (item selected)**  
   You’re editing that item:
   - Name, type, category.
   - **Locations** — Add, edit, or remove stalls/locations. For each location you can:
     - **Toggle opening hours** and set open/close times.
     - **Set closed days** — e.g. tick Sun, Mon so the app knows that stall is closed those days every week.  
   **Store regular rest days** are done here: **Location → (that food item’s location) → turn on opening hours → set closed days.**

---

## Decide

- Choose **Eat at Home** or **Go Out** (or search across everything).
- **Home** — Items grouped by category (Fridge, Snacks, etc.); tap one to “pick” it.
- **Out** — Browse by location or by food type (Noodles, Rice, etc.); tap one to “pick” it.
- Search shows mixed results grouped by Home vs Out.
- The app can mark items as unavailable (e.g. expiry or closure) when relevant.

---

## Food Wasted

- Lists items you marked as “threw it away” on the Food List, with date.
- Reached from the Food List page (e.g. the Food Wasted stats). Optional delete for test items.

---

## Summary

| Where        | What it’s for |
|-------------|----------------|
| **Home**    | Entry: Decide, Food List, Add Info; “closed today” banner. |
| **Food List** | Add all food (Quick Add), Home/Out lists, eaten/thrown, tap to edit → Add Info. |
| **Add Info** | Edit item (name, category, **locations + opening hours + closed days**); or Closure / Expiry when opened from Home. |
| **Decide**  | “What to eat” — pick Home or Out, then an item. |
| **Food Wasted** | History of thrown-away items. |

**Regular rest days for a store:** Food List → tap the food item → Add Info → Locations → add or edit that location → turn on opening hours and set **closed days** (e.g. every Sunday).
