# Ebooks.lk — Secure Library-Style Ebook Store (PWA)

## Project Structure

```
ebooks.lk/
├── prisma/
│   ├── schema.prisma          # SQLite schema (User, Book, BorrowRecord, ReadingLog, SystemSetting)
│   └── seed.ts                # Demo users + default payout rate
├── public/
│   ├── covers/                # Public cover images (JPEG/PNG)
│   ├── icons/                 # PWA icons (add icon-192.png, icon-512.png)
│   └── manifest.json
├── storage/
│   └── epub/                  # Private EPUB files (NOT served statically)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── admin/settings/route.ts
│   │   │   ├── author/dashboard/route.ts
│   │   │   ├── borrow/check-in/route.ts      # Server-side expiry verification
│   │   │   ├── books/
│   │   │   │   ├── route.ts                  # GET catalog
│   │   │   │   ├── upload/route.ts           # POST EPUB + cover
│   │   │   │   └── [id]/
│   │   │   │       ├── borrow/route.ts
│   │   │   │       ├── reborrow/route.ts
│   │   │   │       └── stream/route.ts       # Chunked protected streaming
│   │   │   └── reading-log/sync/route.ts
│   │   ├── offline/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── PwaBootstrap.tsx                  # Launch expiry + sync hooks
│   │   └── reader/EpubReader.tsx             # In-memory decrypt + anti-rip UI
│   ├── lib/
│   │   ├── auth.ts / prisma.ts / borrow.ts
│   │   ├── api-auth.ts / borrow-verify.ts / storage.ts
│   │   ├── crypto/{client,server}.ts
│   │   ├── offline/{idb,borrow-manager}.ts
│   │   └── validation/bookUpload.ts
│   ├── types/next-auth.d.ts
│   └── worker/index.ts                       # Service Worker (expiry purge, BG sync)
├── next.config.ts                            # next-pwa integration
└── package.json
```

## Setup

```bash
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

## Security Notes

- EPUB files live in `storage/epub/` and are only accessible via `/api/books/[id]/stream` after JWT + subscription + borrow checks.
- Client stores AES-GCM encrypted chunks in IndexedDB; decryption is in-memory only.
- Server `/api/borrow/check-in` is the source of truth for expiry (guards against clock tampering).
- Cover images are public in `public/covers/` for storefront browsing.

## Demo Accounts (seed)

| Email | Password | Role |
|-------|----------|------|
| admin@ebooks.lk | changeme123 | ADMIN |
| author@ebooks.lk | changeme123 | AUTHOR |
| member@ebooks.lk | changeme123 | MEMBER |
