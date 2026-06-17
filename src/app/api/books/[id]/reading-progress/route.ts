import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, isSession, jsonError } from "@/lib/api-auth";
import { expireStaleBorrowsForUser } from "@/lib/borrow-verify";

type RouteContext = { params: Promise<{ id: string }> };

const progressSchema = z.object({
  positionCfi: z.string().min(1),
  href: z.string().optional(),
  progressPercentage: z.number().min(0).max(1),
  readAt: z.string().datetime().optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id: bookId } = await context.params;

  const log = await prisma.readingLog.findUnique({
    where: {
      userId_bookId: { userId: session.user.id, bookId },
    },
    select: {
      lastPositionCfi: true,
      lastReadHref: true,
      lastReadProgress: true,
      lastReadAt: true,
      totalReadingTimeInSeconds: true,
    },
  });

  if (!log) {
    return NextResponse.json({
      positionCfi: null,
      href: null,
      progressPercentage: null,
      lastReadAt: null,
      totalReadingTimeInSeconds: 0,
    });
  }

  return NextResponse.json({
    positionCfi: log.lastPositionCfi,
    href: log.lastReadHref,
    progressPercentage: log.lastReadProgress,
    lastReadAt: log.lastReadAt?.toISOString() ?? null,
    totalReadingTimeInSeconds: log.totalReadingTimeInSeconds,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id: bookId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Validation failed", 400);
  }

  await expireStaleBorrowsForUser(session.user.id);

  const borrow = await prisma.borrowRecord.findUnique({
    where: {
      userId_bookId: { userId: session.user.id, bookId },
    },
  });

  if (!borrow || borrow.status !== "ACTIVE") {
    return jsonError("No active borrow", 403);
  }

  const readAt = parsed.data.readAt ? new Date(parsed.data.readAt) : new Date();

  await prisma.readingLog.upsert({
    where: {
      userId_bookId: { userId: session.user.id, bookId },
    },
    create: {
      userId: session.user.id,
      bookId,
      totalReadingTimeInSeconds: 0,
      lastPositionCfi: parsed.data.positionCfi,
      lastReadHref: parsed.data.href ?? null,
      lastReadProgress: parsed.data.progressPercentage,
      lastReadAt: readAt,
      lastSyncedAt: new Date(),
    },
    update: {
      lastPositionCfi: parsed.data.positionCfi,
      lastReadHref: parsed.data.href ?? null,
      lastReadProgress: parsed.data.progressPercentage,
      lastReadAt: readAt,
      lastSyncedAt: new Date(),
    },
  });

  return NextResponse.json({ saved: true, readAt: readAt.toISOString() });
}
