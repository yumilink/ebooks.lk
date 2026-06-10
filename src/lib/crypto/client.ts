/**
 * Client-side Web Crypto helpers for AES-GCM encryption of EPUB chunks in IndexedDB.
 * Decryption happens strictly in-memory during rendering.
 */

import { assertSecureCryptoContext } from "@/lib/crypto/secure-context";

const ALGO = "AES-GCM";
const KEY_LENGTH = 256;

function bufferFromBase64(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64FromBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function deriveAesKey(
  keyMaterialB64: string,
  bookSaltB64: string,
  borrowId: string
): Promise<CryptoKey> {
  assertSecureCryptoContext();
  const encoder = new TextEncoder();
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`${keyMaterialB64}:${bookSaltB64}:${borrowId}`),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(bookSaltB64),
      iterations: 100_000,
      hash: "SHA-256",
    },
    material,
    { name: ALGO, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptChunk(
  key: CryptoKey,
  iv: Uint8Array,
  plaintext: ArrayBuffer
): Promise<ArrayBuffer> {
  const ivBytes = new Uint8Array(iv);
  return crypto.subtle.encrypt({ name: ALGO, iv: ivBytes }, key, plaintext);
}

export async function decryptChunk(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: ArrayBuffer
): Promise<ArrayBuffer> {
  const ivBytes = new Uint8Array(iv);
  return crypto.subtle.decrypt({ name: ALGO, iv: ivBytes }, key, ciphertext);
}

export function ivForChunkIndex(ivSeedB64: string, chunkIndex: number): Uint8Array {
  const seed = bufferFromBase64(ivSeedB64);
  const view = new DataView(new ArrayBuffer(12));
  const seedView = new Uint8Array(seed);
  for (let i = 0; i < Math.min(8, seedView.length); i++) {
    view.setUint8(i, seedView[i]!);
  }
  view.setUint32(8, chunkIndex, false);
  return new Uint8Array(view.buffer);
}

export { base64FromBuffer, bufferFromBase64 };
