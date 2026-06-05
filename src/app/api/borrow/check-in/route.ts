import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, isSession, jsonError } from "@/lib/api-auth";
import { isBorrowExpired } from "@/lib/borrow";

const checkInSchema = z.object({
  bookId: z.string().min(1),
  clientExpiresAt: z.string().datetime().optional(),
});

/**
 * Server-side verification on PWA launch / book open.
 * Cross-checks client clock claims against DB expiresAt.
 */
export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400);
  }

  const { bookId, clientExpiresAt } = parsed.data;
  const now = new Date();

  let borrow = await prisma.borrowRecord.findUnique({
    where: { userId_bookId: { userId: session.user.id, bookId } },
    include: { book: { select: { title: true } } },
  });

  if (!borrow) {
    return NextResponse.json({
      allowed: false,
      reason: "NOT_BORROWED",
      serverTime: now.toISOString(),
    });
  }

  const serverExpired = isBorrowExpired(borrow.expiresAt, now);

  if (serverExpired && borrow.status === "ACTIVE") {
    borrow = await prisma.borrowRecord.update({
      where: { id: borrow.id },
      data: { status: "EXPIRED" },
      include: { book: { select: { title: true } } },
    });
  }

  if (borrow.status === "EXPIRED" || serverExpired) {
    return NextResponse.json({
      allowed: false,
      reason: "BORROW_EXPIRED",
      expiresAt: borrow.expiresAt.toISOString(),
      serverTime: now.toISOString(),
      purgeLocal: true,
    });
  }

  if (clientExpiresAt) {
    const clientExpiry = new Date(clientExpiresAt);
    const driftMs = Math.abs(clientExpiry.getTime() - borrow.expiresAt.getTime());
    if (driftMs > 60_000) {
      return NextResponse.json({
        allowed: true,
        reason: "CLOCK_DRIFT_CORRECTED",
        expiresAt: borrow.expiresAt.toISOString(),
        serverTime: now.toISOString(),
        purgeLocal: false,
        correctedExpiresAt: borrow.expiresAt.toISOString(),
      });
    }
  }

  return NextResponse.json({
    allowed: true,
    reason: "OK",
    expiresAt: borrow.expiresAt.toISOString(),
    borrowId: borrow.id,
    serverTime: now.toISOString(),
    purgeLocal: false,
  });
}
