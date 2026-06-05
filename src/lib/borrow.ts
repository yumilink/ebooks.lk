/** 7-day borrowing window in milliseconds */
export const BORROW_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function computeBorrowExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + BORROW_DURATION_MS);
}

export function isBorrowExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime();
}

export function hasActiveSubscription(
  status: "ACTIVE" | "INACTIVE",
  expiry: Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (status !== "ACTIVE") return false;
  if (!expiry) return false;
  return expiry.getTime() > now.getTime();
}
