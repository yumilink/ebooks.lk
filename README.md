# Ebooks.lk — Secure Library-Style Ebook Store (PWA)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Release](https://img.shields.io/github/v/release/yumilink/ebooks.lk?label=release)](https://github.com/yumilink/ebooks.lk/releases)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Copyright © 2026 [Yumi-Link Technologies Limited](https://github.com/yumilink)**  
Licensed under [GNU GPL v3.0](LICENSE).

Secure library-style ebook borrowing platform with 7-day offline access, EPUB-only DRM, author revenue tracking, and PWA support.

---

## Features

- **7-day offline borrow** — AES-GCM encrypted EPUB chunks in IndexedDB
- **Role-based access** — Admin, Author, Member (NextAuth.js)
- **Protected streaming** — No static EPUB URLs; chunked API with borrow verification
- **Author dashboard** — Reading-time-based earnings estimates
- **PWA** — Service Worker expiry enforcement and reading-log sync

---

## Quick start (local development)

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open **http://localhost:3000/login**

For LAN / HTTPS (phones on Wi‑Fi): see [LAN-ACCESS.md](LAN-ACCESS.md) and run `npm run dev:lan`.

Windows shortcuts: `start-dev.bat` (local) · `start-dev-lan.bat` (HTTPS/LAN) · `stop-dev.bat`

---

## Demo accounts (local development only)

> **⚠️ Production warning**  
> Demo users are created by `npm run db:seed` for **local testing only**.  
> **Never** deploy default seed credentials to a public server.  
> Before production: change all passwords, use strong secrets in `.env`, and do **not** enable demo login UI.

| Email | Role |
|-------|------|
| `member@ebooks.lk` | MEMBER |
| `author@ebooks.lk` | AUTHOR |
| `admin@ebooks.lk` | ADMIN |

Set the seed password in your local `.env` (not committed to Git):

```env
SEED_DEMO_PASSWORD="your-local-dev-password"
```

Then run `npm run db:seed`. One-click demo buttons on the login page appear **only in development mode**.

---

## Security notes

- EPUB files live in `storage/epub/` — served only via `/api/books/[id]/stream` after JWT + subscription + borrow checks.
- Client stores AES-GCM encrypted chunks in IndexedDB; decryption is in-memory only.
- Server `/api/borrow/check-in` is the source of truth for borrow expiry.
- `.env`, `node_modules/`, database files, and uploaded EPUBs are excluded from Git (see `.gitignore`).

---

## Project structure

```
ebooks.lk/
├── prisma/          # Schema + seed
├── public/covers/   # Public cover images
├── storage/epub/    # Private EPUB storage (not in Git)
├── src/app/         # Next.js App Router pages & API
├── src/components/  # UI, reader, layout
├── src/lib/         # Auth, crypto, offline, validation
└── src/worker/      # Service Worker source
```

---

## Links

- **Repository:** https://github.com/yumilink/ebooks.lk
- **Releases:** https://github.com/yumilink/ebooks.lk/releases
- **License:** [GPL-3.0](LICENSE)
