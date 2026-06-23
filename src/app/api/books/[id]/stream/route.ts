import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, isSession, jsonError } from "@/lib/api-auth";
import { hasActiveSubscription } from "@/lib/borrow";
import { verifyBorrowForStream } from "@/lib/borrow-verify";
import { readEpubChunk, getEpubFileSize } from "@/lib/storage";
import { CHUNK_SIZE } from "@/lib/crypto/server";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Protected EPUB streaming — never exposes static file paths.
 * Requires JWT session, active subscription, and valid BorrowRecord.
 *
 * Query: ?chunk=0  (chunk index)
 */
export async function GET(request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id: bookId } = await context.params;
  const { searchParams } = new URL(request.url);
  const chunkIndex = parseInt(searchParams.get("chunk") ?? "0", 10);

  if (Number.isNaN(chunkIndex) || chunkIndex < 0) {
    return jsonError("Invalid chunk index", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return jsonError("User not found", 404);

  if (
    !hasActiveSubscription(user.subscriptionStatus, user.subscriptionExpiry)
  ) {
    return jsonError("Active subscription required", 403);
  }

  const verification = await verifyBorrowForStream(session.user.id, bookId);
  if (!verification.ok) {
    return jsonError(verification.reason, 403);
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return jsonError("Book not found", 404);

  const totalSize = await getEpubFileSize(book.epubFilePath);
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

  if (chunkIndex >= totalChunks) {
    return jsonError("Chunk out of range", 416);
  }

  const start = chunkIndex * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE - 1, totalSize - 1);
  const data = await readEpubChunk(book.epubFilePath, start, end, totalSize);

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Content-Type-Options": "nosniff",
      "X-Chunk-Index": String(chunkIndex),
      "X-Total-Chunks": String(totalChunks),
      "X-Total-Size": String(totalSize),
      "X-Borrow-Expires": verification.borrow.expiresAt.toISOString(),
    },
  });
}

/** HEAD — metadata only for download orchestration */
export async function HEAD(_request: Request, context: RouteContext) {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const { id: bookId } = await context.params;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return jsonError("User not found", 404);

  if (
    !hasActiveSubscription(user.subscriptionStatus, user.subscriptionExpiry)
  ) {
    return jsonError("Active subscription required", 403);
  }

  const verification = await verifyBorrowForStream(session.user.id, bookId);
  if (!verification.ok) {
    return jsonError(verification.reason, 403);
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return jsonError("Book not found", 404);

  const totalSize = await getEpubFileSize(book.epubFilePath);
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

  return new NextResponse(null, {
    status: 200,
    headers: {
      "X-Total-Chunks": String(totalChunks),
      "X-Total-Size": String(totalSize),
      "X-Chunk-Size": String(CHUNK_SIZE),
      "X-Borrow-Expires": verification.borrow.expiresAt.toISOString(),
      "Cache-Control": "no-store",
    },
  });
}
