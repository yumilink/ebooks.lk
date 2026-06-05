import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function requireSession(): Promise<
  Session | NextResponse<{ error: string }>
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export function isSession(
  value: Session | NextResponse
): value is Session {
  return "user" in value && !(value instanceof NextResponse);
}

export async function requireRole(
  roles: Role[]
): Promise<Session | NextResponse<{ error: string }>> {
  const session = await requireSession();
  if (!isSession(session)) return session;

  if (!roles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
