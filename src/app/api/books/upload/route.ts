import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireRole,
  isSession,
  jsonError,
} from "@/lib/api-auth";
import {
  bookUploadSchema,
  ALLOWED_EPUB_MIME,
  ALLOWED_COVER_MIME,
  MAX_EPUB_BYTES,
  MAX_COVER_BYTES,
} from "@/lib/validation/bookUpload";
import {
  saveEpubFile,
  saveCoverImage,
  generateBookSalt,
  isValidEpubBuffer,
  validateIsbn,
  validateCoverMime,
} from "@/lib/storage";

export async function POST(request: Request) {
  const session = await requireRole(["ADMIN", "AUTHOR"]);
  if (!isSession(session)) return session;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid multipart form data", 400);
  }

  const title = String(formData.get("title") ?? "");
  const isbn = String(formData.get("isbn") ?? "");
  const description = formData.get("description")
    ? String(formData.get("description"))
    : undefined;

  const parsed = bookUploadSchema.safeParse({ title, isbn, description });
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Validation failed", 400);
  }

  const normalizedIsbn = parsed.data.isbn.replace(/[-\s]/g, "");
  if (!validateIsbn(normalizedIsbn)) {
    return jsonError("Invalid ISBN checksum", 400);
  }

  const epubFile = formData.get("epub");
  const coverFile = formData.get("cover");

  if (!(epubFile instanceof File) || !(coverFile instanceof File)) {
    return jsonError("Both EPUB and cover image are required", 400);
  }

  if (!ALLOWED_EPUB_MIME.includes(epubFile.type as (typeof ALLOWED_EPUB_MIME)[number])) {
    return jsonError("EPUB file must be application/epub+zip format", 400);
  }

  if (!ALLOWED_COVER_MIME.includes(coverFile.type as (typeof ALLOWED_COVER_MIME)[number])) {
    return jsonError("Cover must be JPEG or PNG", 400);
  }

  if (!epubFile.name.toLowerCase().endsWith(".epub")) {
    return jsonError("Manuscript must have .epub extension", 400);
  }

  if (epubFile.size > MAX_EPUB_BYTES) {
    return jsonError("EPUB exceeds 50 MB limit", 400);
  }

  if (coverFile.size > MAX_COVER_BYTES) {
    return jsonError("Cover image exceeds 5 MB limit", 400);
  }

  const epubBuffer = Buffer.from(await epubFile.arrayBuffer());
  if (!isValidEpubBuffer(epubBuffer)) {
    return jsonError("File is not a valid EPUB (ZIP) archive", 400);
  }

  const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
  const coverExt = validateCoverMime(coverFile.type);
  if (!coverExt) {
    return jsonError("Invalid cover image type", 400);
  }

  const existing = await prisma.book.findUnique({
    where: { isbn: normalizedIsbn },
  });
  if (existing) {
    return jsonError("ISBN already registered", 409);
  }

  const authorId =
    session.user.role === "AUTHOR" ? session.user.id : String(formData.get("authorId") ?? "");

  if (!authorId) {
    return jsonError("authorId is required for admin uploads", 400);
  }

  const author = await prisma.user.findFirst({
    where: { id: authorId, role: { in: ["AUTHOR", "ADMIN"] } },
  });
  if (!author) {
    return jsonError("Invalid author", 400);
  }

  const bookId = crypto.randomUUID();
  const encryptedKey = generateBookSalt();

  const epubFilePath = await saveEpubFile(bookId, epubBuffer);
  const coverImageUrl = await saveCoverImage(bookId, coverBuffer, coverExt);

  const book = await prisma.book.create({
    data: {
      id: bookId,
      title: parsed.data.title,
      isbn: normalizedIsbn,
      description: parsed.data.description,
      epubFilePath,
      coverImageUrl,
      encryptedKey,
      authorId,
    },
    select: {
      id: true,
      title: true,
      isbn: true,
      coverImageUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ book }, { status: 201 });
}
