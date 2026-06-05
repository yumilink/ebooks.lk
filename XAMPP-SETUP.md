# XAMPP / Apache vs Next.js

## Why you saw "Forbidden"

You opened the project folder through **Apache** (port 80), e.g.:

`http://localhost/web-projects/ebooks.lk/`

Apache tries to serve files from disk. This app is **Next.js (Node.js)** — it needs a separate dev server. Without `index.html`, Apache returned **403 Forbidden**.

An `index.html` landing page is now in this folder with setup instructions.

## Correct URL format

| Wrong | Right |
|-------|-------|
| `http://localhost/web-projects/ebooks.lk:3000/login` | `http://localhost:3000/login` |
| `http://localhost/web-projects/ebooks.lk/login` | `http://localhost:3000/login` |

**Port 3000** belongs on the hostname, not in the path:

```
http://localhost:3000/login
       ^host      ^port  ^path
```

Apache (XAMPP) = port **80** → PHP/static files in `htdocs`  
Next.js dev server = port **3000** → this app

Both can run at the same time.

## Quick start (Windows)

1. Install [Node.js LTS](https://nodejs.org/)
2. Double-click **`start-dev.bat`** in this folder  
   — or in a terminal:
   ```bash
   npm install
   copy .env.example .env
   npm run db:setup
   npm run dev
   ```
3. Open **http://localhost:3000/login**

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Member | member@ebooks.lk | changeme123 |
| Author | author@ebooks.lk | changeme123 |
| Admin | admin@ebooks.lk | changeme123 |

Run `npm run db:seed` if login fails (creates accounts in SQLite).

## Optional: proxy through Apache

If you need a path like `http://localhost/ebooks.lk/`, you must:

1. Enable `mod_proxy` in XAMPP Apache
2. Set `basePath` in `next.config.ts`
3. Run `npm run dev` on port 3000 anyway
4. Proxy Apache → Node

For local development, **`http://localhost:3000`** is simpler and recommended.
