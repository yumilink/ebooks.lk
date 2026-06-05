# How to start Ebooks.lk (Windows terminal guide)

## Is it a certificate issue?

**Usually no.** `ERR_CONNECTION_CLOSED` almost always means one of these:

1. **The server is not running** (most common)
2. **Wrong URL** — you opened `https://` but the server is `http://` only (or the opposite)
3. **Windows Firewall** blocked Node.js (less common)

A certificate warning looks **different** — the page loads but the browser says "Your connection is not private" and lets you click **Advanced → Proceed**. That is normal for `dev:lan`.

---

## Open the terminal

### Option A — From Cursor / VS Code
1. Menu: **Terminal → New Terminal**
2. A panel opens at the bottom

### Option B — From Windows
1. Press **Win + R**
2. Type `cmd` and press **Enter**
3. Or search **Command Prompt** or **PowerShell** in the Start menu

---

## Go to the project folder

Copy and paste this line, then press **Enter**:

```cmd
cd c:\xampp\htdocs\web-projects\ebooks.lk
```

---

## Choose ONE mode (do not mix http and https)

### Mode 1 — This PC only (easiest, no certificate)

Run:

```cmd
npm run dev
```

When you see `✓ Ready`, open in the browser:

```
http://localhost:3000/login
```

**Important:** use **http://** not https://

Leave the terminal window **open**. Closing it or pressing Ctrl+C stops the site.

---

### Mode 2 — Phone / another PC on same Wi‑Fi (HTTPS)

1. **Stop** any running server first: click the terminal, press **Ctrl+C**

2. Run:

```cmd
npm run dev:lan
```

3. When you see `✓ Ready` and URLs starting with **https://**, open:

```
https://192.168.1.241:3000/login
```

Replace `192.168.1.241` with your PC IP (`ipconfig` → IPv4 Address).

4. Accept the browser warning once (Advanced → Proceed).

5. If login fails on other devices, edit `.env`:

```env
NEXTAUTH_URL=https://192.168.1.241:3000
```

Stop the server (Ctrl+C), run `npm run dev:lan` again.

---

## Quick checklist

| You want… | Command | Browser URL |
|-----------|---------|---------------|
| Use site on **this PC** | `npm run dev` | **http**://localhost:3000/login |
| Use site on **phone/tablet** | `npm run dev:lan` | **https**://YOUR-IP:3000/login |

---

## If `npm` is not recognized

Close the terminal, open a **new** one, try again.  
If it still fails, restart the PC (Node.js was installed recently).

---

## Double-click shortcuts (no typing)

| File | Mode |
|------|------|
| `start-dev.bat` | HTTP — this PC |
| `start-dev-lan.bat` | HTTPS — other devices |

Double-click the `.bat` file in File Explorer, or run it from the project folder in terminal.
