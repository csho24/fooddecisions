/** Home food list: leftovers first, then soonest expiry, then name. */

export function isLeftoverName(name: string): boolean {
  return /leftover/i.test(name);
}

export interface HomeListSortItem {
  name: string;
  expiryDate?: string | null;
}

function expiryTime(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

export function compareHomeFoodListItems(a: HomeListSortItem, b: HomeListSortItem): number {
  const aLeftover = isLeftoverName(a.name);
  const bLeftover = isLeftoverName(b.name);
  if (aLeftover !== bLeftover) return aLeftover ? -1 : 1;

  const aExpiry = expiryTime(a.expiryDate);
  const bExpiry = expiryTime(b.expiryDate);
  if (aExpiry !== null && bExpiry !== null) return aExpiry - bExpiry;
  if (aExpiry !== null) return -1;
  if (bExpiry !== null) return 1;
  return a.name.localeCompare(b.name);
}
