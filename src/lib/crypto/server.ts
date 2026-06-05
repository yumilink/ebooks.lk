import { createHmac, randomBytes } from "crypto";

const CHUNK_SIZE = 256 * 1024; // 256 KB

export { CHUNK_SIZE };

export function deriveStreamHeaders(
  borrowId: string,
  bookSalt: string
): { chunkKeyMaterial: string; ivSeed: string } {
  const secret = process.env.STREAM_TOKEN_SECRET;
  if (!secret) {
    throw new Error("STREAM_TOKEN_SECRET is not configured");
  }

  const chunkKeyMaterial = createHmac("sha256", secret)
    .update(`${borrowId}:${bookSalt}:chunk-key`)
    .digest("base64");

  const ivSeed = createHmac("sha256", secret)
    .update(`${borrowId}:${bookSalt}:iv-seed`)
    .digest("base64");

  return { chunkKeyMaterial, ivSeed };
}

export function generateClientKeyEnvelope(): string {
  return randomBytes(32).toString("base64");
}
