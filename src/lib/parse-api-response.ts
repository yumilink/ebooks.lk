/** Parse JSON API responses; surface HTML/plain error pages from proxies as readable errors. */
export async function parseApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    if (res.status === 413) {
      throw new Error(
        "Upload too large for the server (max 50 MB EPUB). Ask admin to raise the nginx limit."
      );
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Session expired or not allowed. Sign in again and retry.");
    }
    throw new Error(
      `Server error (${res.status}). Upload may have been blocked by the proxy — try a smaller file or contact support.`
    );
  }
}
