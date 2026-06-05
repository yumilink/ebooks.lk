"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface AuthorOption {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export default function AuthorUploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [title, setTitle] = useState("");
  const [isbn, setIsbn] = useState("");
  const [description, setDescription] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [epub, setEpub] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/author/upload");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/admin/authors")
        .then((r) => r.json())
        .then((data) => setAuthors(data.authors ?? []))
        .catch(() => setAuthors([]));
    }
  }, [session?.user?.role]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-stone-500">
        Loading…
      </div>
    );
  }

  if (
    session?.user?.role !== "AUTHOR" &&
    session?.user?.role !== "ADMIN"
  ) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Alert variant="error">Authors and admins only.</Alert>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!epub || !cover) {
      setError("EPUB manuscript and cover image are required.");
      return;
    }

    if (!epub.name.toLowerCase().endsWith(".epub")) {
      setError("Manuscript must be an .epub file.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("isbn", isbn);
    formData.append("description", description);
    formData.append("epub", epub);
    formData.append("cover", cover);
    if (session?.user?.role === "ADMIN" && authorId) {
      formData.append("authorId", authorId);
    }

    try {
      const res = await fetch("/api/books/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      setSuccess(`"${data.book.title}" published successfully.`);
      setTitle("");
      setIsbn("");
      setDescription("");
      setEpub(null);
      setCover(null);
      router.push(`/books/${data.book.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardTitle>Publish a book</CardTitle>
        <CardDescription>
          Upload an EPUB manuscript and cover image. PDF files are not accepted.
        </CardDescription>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Book title"
            />
          </div>

          <div>
            <Label htmlFor="isbn">ISBN (10 or 13 digits)</Label>
            <Input
              id="isbn"
              required
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="9780141439518"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Synopsis for the storefront…"
            />
          </div>

          {session?.user?.role === "ADMIN" && (
            <div>
              <Label htmlFor="authorId">Author</Label>
              <select
                id="authorId"
                required
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Select author…</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name ?? a.email} ({a.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="epub">EPUB manuscript</Label>
            <Input
              id="epub"
              type="file"
              accept=".epub,application/epub+zip"
              required
              onChange={(e) => setEpub(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-stone-500">Max 50 MB · EPUB only</p>
          </div>

          <div>
            <Label htmlFor="cover">Cover image</Label>
            <Input
              id="cover"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              required
              onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-stone-500">JPEG or PNG · Max 5 MB · Public on storefront</p>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Publish book
          </Button>
        </form>
      </Card>
    </div>
  );
}
