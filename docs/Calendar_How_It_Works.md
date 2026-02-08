# Closure Calendar — How It Works

Plain-English description of how the closure calendar behaves for users (Add Info → Cleaning / Time Off).

---

## What the calendar is for

You use it to mark when stalls are **closed for cleaning** or **closed for time off**. Those dates show on the calendar and in a list below it, and days when something is closed today show on the home page.

---

## Two tabs, one idea

- **Cleaning** – “This stall is closed on these dates for cleaning.”
- **Time off** – “This stall is closed on these dates (e.g. leave, break).”

Same calendar component is used in both tabs. You pick dates, then choose location and (if needed) which food item/stall it applies to.

---

## What you see on the calendar

### Colours

- **Blue** = at least one cleaning closure on that date.  
  - **Lighter blue** = one stall/location.  
  - **Darker blue** = two or more different stalls/locations closed that day (so you can tell “busy” days at a glance).
- **Amber/orange** = time off on that date.
- **Half blue, half amber** = same date has both cleaning and time off (e.g. one stall cleaning, another on leave).

### Today

- **Plain day (no closure):** Today’s date is **green**, **bold**, and **slightly larger** so it’s easy to spot.
- **Day with a closure:** Today still stands out: the number is **bold** and **slightly larger**, but the cell keeps its blue or amber (or half-and-half). So “today” is always obvious even on closure days.

### Selection (Cleaning tab only)

- When you’re picking dates to add a cleaning closure, the dates you’ve selected get an **orange ring**. Saved cleaning dates stay blue; you can tap a saved date again to add another stall for that same day.

---

## Choosing dates

- **Cleaning:** Tap dates to select one or many. You can include dates that already have cleaning (to add another stall). You can’t select dates that are already time off.
- **Time off:** Same idea; you can’t select dates that are already cleaning. Typically only future dates are used for time off.

After choosing dates you enter the location and link to a food item/stall; that’s what creates the “X stall closed on these days” link.

---

## List below the calendar

The list shows all upcoming closures you’ve saved, grouped in a readable way:

- **Cleaning** – by date and location (e.g. “Ghim Moh • Cleaning”).
- **Time off** – by stall/location with **date ranges** when possible (e.g. “Ghim Moh stall, 9–15 Feb” instead of seven separate lines).

So you can scan “who’s closed when” without counting individual dates.

---

## Home page

If **today** has any scheduled closures, the home page shows a banner like “1 Ghim Moh stall closed today” (or “2 Clementi stalls closed today”). The number is the **count of closures** for that group, not the day of the month.

---

**See also:** Technical implementation in [Project Architecture](./Project%20Architecture.md) § Calendar.
