import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getValidBorrow } from "@/lib/borrow-verify";
import { hasActiveSubscription } from "@/lib/borrow";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const book = await prisma.book.findUnique({
    where: { id },
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

  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  let borrow = null;
  let canBorrow = false;

  if (session?.user?.id) {
    borrow = await getValidBorrow(session.user.id, id);
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    canBorrow =
      !!user &&
      hasActiveSubscription(user.subscriptionStatus, user.subscriptionExpiry) &&
      (session.user.role === "MEMBER" || session.user.role === "ADMIN");
  }

  return NextResponse.json({ book, borrow, canBorrow });
}
