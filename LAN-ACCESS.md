# Access from phones / other PCs on your Wi‑Fi

## Two ways to start the server

| Script / command | Protocol | Use this URL |
|------------------|----------|--------------|
| `start-dev.bat` or `npm run dev` | **HTTP** | `http://localhost:3000` (this PC only) |
| `start-dev-lan.bat` or `npm run dev:lan` | **HTTPS** | `https://192.168.x.x:3000` (other devices) |

**You cannot mix them.** If the server is HTTP and you open `https://...`, the browser shows **ERR_CONNECTION_CLOSED**.

## Why borrow fails on `http://192.168.x.x:3000`

Browsers only allow **Web Crypto** (`crypto.subtle`) in a **secure context**:

| URL | Offline borrow |
|-----|----------------|
| `http://localhost:3000` | Works |
| `http://127.0.0.1:3000` | Works |
| `http://192.168.x.x:3000` | **Fails** (encrypt cannot run) |
| `https://192.168.x.x:3000` | Works |

Login and browsing may work over plain HTTP, but **Borrow / Re-download** need encryption and will error until you use HTTPS.

## Start LAN + HTTPS server

```bash
npm run dev:lan
```

Or double-click **`start-dev-lan.bat`**.

Then on another device open:

```
https://192.168.1.241:3000/login
```

(Replace with your PC’s IPv4 from `ipconfig`.)

Accept the browser warning once (self-signed certificate for development).

## NextAuth on LAN

If login fails on other devices, edit `.env`:

```env
NEXTAUTH_URL=https://192.168.1.241:3000
```

Restart the dev server after changing `.env`.

## Windows Firewall

Allow Node.js through the firewall when prompted, or allow inbound TCP port **3000**.
