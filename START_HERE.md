# SiccaSync — Start Here

## ⚡ Quick Start (2 minutes)

This is a **Next.js web application**. You cannot open the HTML files directly in a browser.
You must run it with Node.js.

### Step 1 — Install Node.js (if you don't have it)
Download from: https://nodejs.org  (choose LTS version)

### Step 2 — Open terminal in this folder
- Windows: Right-click the folder → "Open in Terminal" (or use VS Code)
- Mac/Linux: `cd /path/to/siccasync-final`

### Step 3 — Install dependencies (first time only)
```
npm install
```

### Step 4 — Start the app
```
npm run dev
```

### Step 5 — Open in browser
Go to: **http://localhost:9002**

---

## 🔑 Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@sicca.com | Admin@1234 | Super Admin |

> **Works immediately without any Google Sheets setup!** (runs in demo mode)

---

## 📊 Connect to Google Sheets (optional — for real data)

1. Open your Google Spreadsheet
2. Go to **Extensions → Apps Script**
3. Create new files and paste each `.gs` file from the `apps-script/` folder
4. Run `initialSetup()` once (click Run in the editor)
5. **Deploy → New deployment → Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the Web App URL
7. Open `.env.local` in this folder and set:
   ```
   APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
   ```
8. Restart with `npm run dev`

---

## 🗺️ Storage Map Feature

The **Storage Map** page (`/inventory-map`) shows a visual grid of all your cupboards/storage locations.

- **Click any cupboard tile** → side panel opens showing all items inside
- **Items show**: name, code, quantity badge, category, description
- **Images**: if a cupboard or item has an image URL set, a thumbnail shows — click it for fullscreen lightbox
- **Status colours**: green = OK, amber = low stock, red = out of stock
- **Add cupboard**: click "Add Cupboard" button, fill the form
- **Add items to cupboard**: open the cupboard panel → click "Add Item"

---

## ❓ Common Problems

| Problem | Fix |
|---------|-----|
| "Unexpected token '<'" on login | You're not running `npm run dev`. Open terminal → `npm run dev` → go to http://localhost:9002 |
| Login says "Network error" | Same — app is not running. See Step 4 above. |
| Port 9002 already in use | Run `npm run dev -- -p 3000` instead, go to http://localhost:3000 |
| npm not found | Install Node.js from https://nodejs.org |
| Build errors | Run `npm install` again, then `npm run dev` |

