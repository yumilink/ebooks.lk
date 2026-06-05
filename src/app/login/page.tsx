import { Suspense } from "react";
import LoginPage from "./LoginForm";

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-stone-500">Loading…</div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
