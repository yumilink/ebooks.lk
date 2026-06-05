import { prisma } from "@/lib/prisma";
import { isBorrowExpired } from "@/lib/borrow";
import type { BorrowRecord } from "@prisma/client";

/**
 * Server-side source of truth: expire stale borrows before any stream/check-in.
 */
export async function expireStaleBorrowsForUser(
  userId: string,
  now: Date = new Date()
): Promise<number> {
  const stale = await prisma.borrowRecord.findMany({
    where: {
      userId,
      status: "ACTIVE",
      expiresAt: { lte: now },
    },
  });

  if (stale.length === 0) return 0;

  await prisma.borrowRecord.updateMany({
    where: {
      id: { in: stale.map((r) => r.id) },
    },
    data: { status: "EXPIRED" },
  });

  return stale.length;
}

export async function getValidBorrow(
  userId: string,
  bookId: string
): Promise<BorrowRecord | null> {
  await expireStaleBorrowsForUser(userId);

  const record = await prisma.borrowRecord.findUnique({
    where: { userId_bookId: { userId, bookId } },
  });

  if (!record || record.status !== "ACTIVE") return null;
  if (isBorrowExpired(record.expiresAt)) {
    await prisma.borrowRecord.update({
      where: { id: record.id },
      data: { status: "EXPIRED" },
    });
    return null;
  }

  return record;
}

export async function verifyBorrowForStream(
  userId: string,
  bookId: string
): Promise<{ ok: true; borrow: BorrowRecord } | { ok: false; reason: string }> {
  const borrow = await getValidBorrow(userId, bookId);
  if (!borrow) {
    return { ok: false, reason: "No active borrow or borrowing period expired" };
  }
  return { ok: true, borrow };
}
