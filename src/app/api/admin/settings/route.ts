import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, isSession, jsonError } from "@/lib/api-auth";

const settingSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(1000),
});

export async function GET() {
  const session = await requireRole(["ADMIN"]);
  if (!isSession(session)) return session;

  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: "asc" },
  });

  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const session = await requireRole(["ADMIN"]);
  if (!isSession(session)) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = settingSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400);
  }

  const setting = await prisma.systemSetting.upsert({
    where: { key: parsed.data.key },
    create: parsed.data,
    update: { value: parsed.data.value },
  });

  return NextResponse.json({ setting });
}
