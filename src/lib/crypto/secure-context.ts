/**
 * Web Crypto (crypto.subtle) is only available in a "secure context":
 * - https:// (any host)
 * - http://localhost
 * - http://127.0.0.1
 *
 * http://192.168.x.x over plain HTTP is NOT secure — borrow/offline encrypt will fail.
 */

export function isSecureCryptoContext(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.isSecureContext === true &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.subtle !== "undefined"
  );
}

export const INSECURE_CONTEXT_MESSAGE =
  "Offline borrow requires HTTPS when using a network IP (e.g. 192.168.x.x). " +
  "Use http://localhost:3000 on this PC, or start the LAN server with npm run dev:lan " +
  "and open https://YOUR-IP:3000 (accept the browser security warning once).";

export function assertSecureCryptoContext(): void {
  if (!isSecureCryptoContext()) {
    throw new Error(INSECURE_CONTEXT_MESSAGE);
  }
}
