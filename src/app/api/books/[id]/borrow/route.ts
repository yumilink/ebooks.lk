import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, isSession, jsonError } from "@/lib/api-auth";
import { hasActiveSubscription, computeBorrowExpiry } from "@/lib/borrow";
import { getValidBorrow } from "@/lib/borrow-verify";
import { deriveStreamHeaders, CHUNK_SIZE } from "@/lib/crypto/server";
import { getEpubFileSize } from "@/lib/storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id: bookId } = await context.params;

  if (session.user.role !== "MEMBER" && session.user.role !== "ADMIN") {
    return jsonError("Only members can borrow books", 403);
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return jsonError("User not found", 404);

  if (
    !hasActiveSubscription(user.subscriptionStatus, user.subscriptionExpiry)
  ) {
    return jsonError("Active subscription required to borrow", 403);
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return jsonError("Book not found", 404);

  const existing = await getValidBorrow(session.user.id, bookId);
  if (existing) {
    return NextResponse.json({
      borrow: existing,
      crypto: deriveStreamHeaders(existing.id, book.encryptedKey),
      bookSalt: book.encryptedKey,
      chunkSize: CHUNK_SIZE,
      totalSize: await getEpubFileSize(book.epubFilePath),
      message: "Already borrowed — use re-borrow to extend",
    });
  }

  const expiresAt = computeBorrowExpiry();

  const borrow = await prisma.borrowRecord.upsert({
    where: {
      userId_bookId: { userId: session.user.id, bookId },
    },
    create: {
      userId: session.user.id,
      bookId,
      borrowedAt: new Date(),
      expiresAt,
      status: "ACTIVE",
    },
    update: {
      borrowedAt: new Date(),
      expiresAt,
      status: "ACTIVE",
    },
  });

  const totalSize = await getEpubFileSize(book.epubFilePath);

  return NextResponse.json(
    {
      borrow,
      crypto: deriveStreamHeaders(borrow.id, book.encryptedKey),
      bookSalt: book.encryptedKey,
      chunkSize: CHUNK_SIZE,
      totalSize,
    },
    { status: 201 }
  );
}
