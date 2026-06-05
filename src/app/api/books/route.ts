import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, isSession } from "@/lib/api-auth";

export async function GET() {
  const session = await requireSession();
  if (!isSession(session)) return session;

  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      isbn: true,
      description: true,
      coverImageUrl: true,
      createdAt: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ books });
}
