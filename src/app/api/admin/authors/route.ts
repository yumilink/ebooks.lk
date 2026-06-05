import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, isSession } from "@/lib/api-auth";

export async function GET() {
  const session = await requireRole(["ADMIN"]);
  if (!isSession(session)) return session;

  const authors = await prisma.user.findMany({
    where: { role: { in: ["AUTHOR", "ADMIN"] } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ authors });
}
