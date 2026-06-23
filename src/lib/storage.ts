import { mkdir, writeFile, readFile, stat } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "storage");
const EPUB_DIR = path.join(UPLOAD_ROOT, "epub");
const COVER_DIR = path.join(process.cwd(), "public", "covers");

const epubSizeCache = new Map<string, { size: number; cachedAt: number }>();
const EPUB_SIZE_CACHE_MS = 60_000;

export async function ensureStorageDirs(): Promise<void> {
  await mkdir(EPUB_DIR, { recursive: true });
  await mkdir(COVER_DIR, { recursive: true });
}

export function generateBookSalt(): string {
  return randomBytes(32).toString("base64");
}

export async function saveEpubFile(
  bookId: string,
  buffer: Buffer
): Promise<string> {
  await ensureStorageDirs();
  const relativePath = path.join("epub", `${bookId}.epub`);
  const absolutePath = path.join(UPLOAD_ROOT, relativePath);
  await writeFile(absolutePath, buffer);
  return relativePath.replace(/\\/g, "/");
}

export async function saveCoverImage(
  bookId: string,
  buffer: Buffer,
  ext: "jpg" | "jpeg" | "png"
): Promise<string> {
  await ensureStorageDirs();
  const filename = `${bookId}.${ext === "jpeg" ? "jpg" : ext}`;
  const absolutePath = path.join(COVER_DIR, filename);
  await writeFile(absolutePath, buffer);
  return `/covers/${filename}`;
}

export function resolveEpubAbsolutePath(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");
  if (normalized.includes("..")) {
    throw new Error("Invalid epub path");
  }
  return path.join(UPLOAD_ROOT, normalized);
}

export async function readEpubChunk(
  relativePath: string,
  start: number,
  end: number,
  knownFileSize?: number
): Promise<Buffer> {
  const absolutePath = resolveEpubAbsolutePath(relativePath);
  const fileSize =
    knownFileSize ?? (await stat(absolutePath)).size;
  const safeStart = Math.max(0, start);
  const safeEnd = Math.min(fileSize - 1, end);

  const handle = await import("fs/promises").then((fs) =>
    fs.open(absolutePath, "r")
  );
  try {
    const length = safeEnd - safeStart + 1;
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, safeStart);
    return buffer;
  } finally {
    await handle.close();
  }
}

export async function getEpubFileSize(relativePath: string): Promise<number> {
  const cached = epubSizeCache.get(relativePath);
  if (cached && Date.now() - cached.cachedAt < EPUB_SIZE_CACHE_MS) {
    return cached.size;
  }

  const absolutePath = resolveEpubAbsolutePath(relativePath);
  const fileStat = await stat(absolutePath);
  epubSizeCache.set(relativePath, { size: fileStat.size, cachedAt: Date.now() });
  return fileStat.size;
}

export async function readFullEpub(relativePath: string): Promise<Buffer> {
  const absolutePath = resolveEpubAbsolutePath(relativePath);
  return readFile(absolutePath);
}

/** Validate EPUB magic — ZIP archive starting with PK\x03\x04 */
export function isValidEpubBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  );
}

const COVER_MIME: Record<string, "jpg" | "jpeg" | "png"> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
};

export function validateCoverMime(
  mime: string
): "jpg" | "jpeg" | "png" | null {
  return COVER_MIME[mime.toLowerCase()] ?? null;
}

export function validateIsbn(isbn: string): boolean {
  const cleaned = isbn.replace(/[-\s]/g, "");
  if (!/^(?:\d{10}|\d{13})$/.test(cleaned)) return false;

  if (cleaned.length === 10) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i], 10) * (10 - i);
    }
    const check = cleaned[9] === "X" ? 10 : parseInt(cleaned[9], 10);
    return (sum + check) % 11 === 0;
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(cleaned[12], 10);
}
