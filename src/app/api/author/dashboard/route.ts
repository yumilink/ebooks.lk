import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isSession } from "@/lib/api-auth";

const DEFAULT_PAYOUT_KEY = "base_payout_rate_per_minute";

export async function GET() {
  const session = await requireRole(["AUTHOR", "ADMIN"]);
  if (!isSession(session)) return session;

  const authorId =
    session.user.role === "AUTHOR" ? session.user.id : undefined;

  const payoutSetting = await prisma.systemSetting.findUnique({
    where: { key: DEFAULT_PAYOUT_KEY },
  });
  const ratePerMinute = parseFloat(payoutSetting?.value ?? "0.01");

  const books = await prisma.book.findMany({
    where: authorId ? { authorId } : undefined,
    select: {
      id: true,
      title: true,
      isbn: true,
      coverImageUrl: true,
      _count: {
        select: {
          borrowRecords: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  const bookIds = books.map((b) => b.id);

  const readingAgg = await prisma.readingLog.groupBy({
    by: ["bookId"],
    where: { bookId: { in: bookIds } },
    _sum: { totalReadingTimeInSeconds: true },
  });

  const borrowAgg = await prisma.borrowRecord.groupBy({
    by: ["bookId"],
    where: { bookId: { in: bookIds } },
    _count: { _all: true },
  });

  const readingMap = new Map(
    readingAgg.map((r) => [r.bookId, r._sum.totalReadingTimeInSeconds ?? 0])
  );
  const borrowMap = new Map(
    borrowAgg.map((b) => [b.bookId, b._count._all])
  );

  const breakdown = books.map((book) => {
    const totalSeconds = readingMap.get(book.id) ?? 0;
    const totalMinutes = totalSeconds / 60;
    const earnings = totalMinutes * ratePerMinute;

    return {
      bookId: book.id,
      title: book.title,
      isbn: book.isbn,
      coverImageUrl: book.coverImageUrl,
      activeBorrows: book._count.borrowRecords,
      totalBorrows: borrowMap.get(book.id) ?? 0,
      totalReadingMinutes: Math.round(totalMinutes * 100) / 100,
      estimatedEarnings: Math.round(earnings * 100) / 100,
    };
  });

  const totalEarnings = breakdown.reduce((sum, b) => sum + b.estimatedEarnings, 0);

  return NextResponse.json({
    disclaimer:
      "Earnings are estimates subject to change based on platform terms and dynamic admin settings.",
    ratePerMinute,
    rateSettingKey: DEFAULT_PAYOUT_KEY,
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    breakdown,
  });
}
