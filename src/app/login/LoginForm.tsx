"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { demoAccounts, DEMO_PASSWORD } from "@/lib/demo-accounts";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/books";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWith(email: string, password: string) {
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Run npm run db:seed if demo accounts are missing.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signInWith(email, password);
  }

  async function handleDemoLogin(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    await signInWith(demoEmail, DEMO_PASSWORD);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <Card>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Access your library borrows and author tools.</CardDescription>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@ebooks.lk"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <div className="mt-8 border-t border-stone-100 pt-6">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-stone-500">
            Demo accounts
          </p>
          <p className="mt-1 text-center text-xs text-stone-400">
            Password for all: <span className="font-mono">{DEMO_PASSWORD}</span>
          </p>
          <div className="mt-4 space-y-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin(account.email)}
                className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-4 py-3 text-left text-sm transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50"
              >
                <div>
                  <p className="font-medium text-stone-900">{account.name}</p>
                  <p className="text-xs text-stone-500">{account.description}</p>
                </div>
                <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                  {account.role}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/books" className="text-amber-700 hover:underline">
            Browse catalog without signing in
          </Link>
        </p>
      </Card>
    </div>
  );
}
