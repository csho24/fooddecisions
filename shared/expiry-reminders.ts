/**
 * Home-screen expiry reminders: items in the last 12 days before expiry.
 * Bread is excluded (often frozen/fridge-stored with misleading package dates).
 */

export const EXPIRY_REMINDER_WINDOW_DAYS = 12;

export interface HomeExpiryItemInput {
  id: string;
  name: string;
  type: string;
  expiryDate?: string | null;
}

export interface ExpiryReminderItem {
  id: string;
  name: string;
  daysRemaining: number;
  expiryDate: string;
}

/** Whole-word match so e.g. "gingerbread" is not excluded. */
export function isExcludedFromExpiryReminder(name: string): boolean {
  return /\bbread\b/i.test(name.trim());
}

export function getDaysRemaining(expiryDateIso: string): number | null {
  if (!expiryDateIso) return null;
  const expiry = new Date(expiryDateIso);
  if (Number.isNaN(expiry.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Home items expiring in 1..12 days (inclusive), excluding bread.
 */
export function getHomeExpiryReminders(items: HomeExpiryItemInput[]): ExpiryReminderItem[] {
  const out: ExpiryReminderItem[] = [];
  for (const item of items) {
    if (item.type !== 'home') continue;
    if (!item.expiryDate) continue;
    if (isExcludedFromExpiryReminder(item.name)) continue;
    const daysRemaining = getDaysRemaining(item.expiryDate);
    if (daysRemaining === null) continue;
    if (daysRemaining < 1 || daysRemaining > EXPIRY_REMINDER_WINDOW_DAYS) continue;
    out.push({
      id: String(item.id),
      name: item.name,
      daysRemaining,
      expiryDate: item.expiryDate,
    });
  }
  out.sort((a, b) => a.daysRemaining - b.daysRemaining);
  return out;
}
