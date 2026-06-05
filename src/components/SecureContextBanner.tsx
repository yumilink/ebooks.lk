"use client";

import { useEffect, useState } from "react";
import { isSecureCryptoContext, INSECURE_CONTEXT_MESSAGE } from "@/lib/crypto/secure-context";

export function SecureContextBanner() {
  const [insecure, setInsecure] = useState(false);

  useEffect(() => {
    setInsecure(!isSecureCryptoContext());
  }, []);

  if (!insecure) return null;

  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
    >
      <strong>Limited mode:</strong> {INSECURE_CONTEXT_MESSAGE}
    </div>
  );
}
