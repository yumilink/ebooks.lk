import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, isSession, jsonError } from "@/lib/api-auth";
import { expireStaleBorrowsForUser } from "@/lib/borrow-verify";

const syncSchema = z.object({
  sessions: z.array(
    z.object({
      bookId: z.string().min(1),
      durationSeconds: z.number().int().min(1).max(86400),
      clientTimestamp: z.string().datetime().optional(),
    })
  ).min(1).max(50),
});

export async function POST(request: Request) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Validation failed", 400);
  }

  await expireStaleBorrowsForUser(session.user.id);

  const results: Array<{ bookId: string; synced: boolean; reason?: string }> = [];

  for (const entry of parsed.data.sessions) {
    const borrow = await prisma.borrowRecord.findUnique({
      where: {
        userId_bookId: { userId: session.user.id, bookId: entry.bookId },
      },
    });

    if (!borrow || borrow.status !== "ACTIVE") {
      results.push({ bookId: entry.bookId, synced: false, reason: "No active borrow" });
      continue;
    }

    await prisma.readingLog.upsert({
      where: {
        userId_bookId: { userId: session.user.id, bookId: entry.bookId },
      },
      create: {
        userId: session.user.id,
        bookId: entry.bookId,
        totalReadingTimeInSeconds: entry.durationSeconds,
        lastSyncedAt: new Date(),
      },
      update: {
        totalReadingTimeInSeconds: { increment: entry.durationSeconds },
        lastSyncedAt: new Date(),
      },
    });

    results.push({ bookId: entry.bookId, synced: true });
  }

  return NextResponse.json({ results, syncedAt: new Date().toISOString() });
}
