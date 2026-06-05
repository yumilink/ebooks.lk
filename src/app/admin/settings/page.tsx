"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [newKey, setNewKey] = useState("base_payout_rate_per_minute");
  const [newValue, setNewValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/admin/settings");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") return;

    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data.settings ?? []);
        const payout = (data.settings ?? []).find(
          (s: Setting) => s.key === "base_payout_rate_per_minute"
        );
        if (payout) setNewValue(payout.value);
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, [session?.user?.role]);

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-stone-500">
        Loading…
      </div>
    );
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Alert variant="error">Admin access required.</Alert>
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey, value: newValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setMessage(`Setting "${newKey}" updated.`);
      setSettings((prev) => {
        const exists = prev.find((s) => s.key === newKey);
        if (exists) {
          return prev.map((s) => (s.key === newKey ? data.setting : s));
        }
        return [...prev, data.setting];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function loadSetting(key: string, value: string) {
    setNewKey(key);
    setNewValue(value);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardTitle>Platform settings</CardTitle>
        <CardDescription>
          Configure dynamic variables such as author payout rates. Changes affect
          future earnings calculations.
        </CardDescription>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <div>
            <Label htmlFor="key">Setting key</Label>
            <Input
              id="key"
              required
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="base_payout_rate_per_minute"
            />
          </div>

          <div>
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="0.05"
            />
            <p className="mt-1 text-xs text-stone-500">
              Example: base_payout_rate_per_minute = 0.05 (LKR or currency unit per minute read)
            </p>
          </div>

          <Button type="submit" loading={saving}>
            Save setting
          </Button>
        </form>

        {settings.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-stone-700">Current settings</h3>
            <ul className="mt-3 divide-y divide-stone-100 rounded-lg border border-stone-200">
              {settings.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-mono text-stone-800">{s.key}</p>
                    <p className="text-stone-600">{s.value}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => loadSetting(s.key, s.value)}
                  >
                    Edit
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
