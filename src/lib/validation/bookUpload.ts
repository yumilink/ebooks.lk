import { z } from "zod";

const bookCategoryValues = [
  "NOVEL",
  "POETRY",
  "SHORT_STORY",
  "ESSAY",
  "CHILDREN",
  "ACADEMIC",
  "BIOGRAPHY",
  "DRAMA",
  "OTHER",
] as const;

const bookStatusValues = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const languageValues = ["si", "en", "ta", "other"] as const;

export const isbnSchema = z
  .string()
  .trim()
  .min(10)
  .max(17)
  .refine(
    (val) => {
      const cleaned = val.replace(/[-\s]/g, "");
      return /^(?:\d{10}|\d{13})$/.test(cleaned);
    },
    { message: "ISBN must be 10 or 13 digits" }
  );

export const bookUploadSchema = z.object({
  title: z.string().trim().min(1).max(500),
  isbn: isbnSchema,
  description: z.string().trim().max(5000).optional(),
  category: z.enum(bookCategoryValues),
  language: z.enum(languageValues),
  publicationYear: z
    .number()
    .int()
    .min(1000)
    .max(new Date().getFullYear() + 1)
    .optional()
    .nullable(),
  publisher: z.string().trim().max(200).optional(),
  status: z.enum(bookStatusValues).default("PUBLISHED"),
  tags: z.string().trim().max(500).optional(),
});

export const ALLOWED_EPUB_MIME = [
  "application/epub+zip",
  "application/zip",
  "application/octet-stream",
] as const;

export const ALLOWED_COVER_MIME = ["image/jpeg", "image/jpg", "image/png"] as const;

export const MAX_EPUB_BYTES = 50 * 1024 * 1024;
export const MAX_COVER_BYTES = 5 * 1024 * 1024;
