"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

interface BreakdownItem {
  bookId: string;
  title: string;
  isbn: string;
  coverImageUrl: string;
  activeBorrows: number;
  totalBorrows: number;
  totalReadingMinutes: number;
  estimatedEarnings: number;
}

interface DashboardData {
  disclaimer: string;
  ratePerMinute: number;
  totalEarnings: number;
  breakdown: BreakdownItem[];
}

export default function AuthorDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/author/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== "AUTHOR" && session?.user?.role !== "ADMIN") return;

    fetch("/api/author/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [session?.user?.role]);

  if (status === "loading") {
    return <div className="py-16 text-center text-stone-500">Loading…</div>;
  }

  if (session?.user?.role !== "AUTHOR" && session?.user?.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Alert variant="error">Authors and admins only.</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card className="mb-8">
        <CardTitle>Author earnings</CardTitle>
        <CardDescription>
          {data?.disclaimer ??
            "Calculations are subject to change based on platform terms and dynamic settings."}
        </CardDescription>
        {data && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-stone-50 p-4">
              <p className="text-xs uppercase text-stone-500">Rate per minute</p>
              <p className="text-2xl font-semibold">{data.ratePerMinute}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs uppercase text-stone-500">Total estimated</p>
              <p className="text-2xl font-semibold text-amber-900">
                {data.totalEarnings.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      {data?.breakdown.length === 0 && (
        <p className="text-center text-stone-500">No published books yet.</p>
      )}

      <div className="space-y-4">
        {data?.breakdown.map((book) => (
          <div
            key={book.bookId}
            className="flex gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded bg-stone-100">
              <Image src={book.coverImageUrl} alt={book.title} fill className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-stone-900">{book.title}</h3>
              <p className="text-xs text-stone-500">ISBN {book.isbn}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-stone-600">
                <span>{book.totalReadingMinutes} min read</span>
                <span>{book.totalBorrows} borrows</span>
                <span>{book.activeBorrows} active</span>
                <span className="font-medium text-amber-800">
                  {book.estimatedEarnings.toFixed(2)} est.
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
