# SiccaSync — Apps Script Setup Guide (5 steps)

## Step 1 — Open your Google Sheet

Open the Google Sheet you want to use as your database.
If you don't have one, create a new blank spreadsheet at sheets.google.com.

---

## Step 2 — Open Apps Script

In your Google Sheet:
**Extensions → Apps Script**

A code editor opens. Delete any existing code.

---

## Step 3 — Paste the 4 files

In the Apps Script editor, create 4 files and paste content from the `apps-script/` folder:

| File in editor  | Paste from                        |
|-----------------|-----------------------------------|
| `Code.gs`       | `apps-script/Code.gs`             |
| `Utils.gs`      | `apps-script/Utils.gs`            |
| `Auth.gs`       | `apps-script/Auth.gs`             |
| `Inventory.gs`  | `apps-script/Inventory.gs`        |
| `Other.gs`      | `apps-script/Other.gs`            |

To add files: click the **+** button next to "Files" in the left panel.

---

## Step 4 — Run initialSetup()

1. Select `Code.gs`
2. In the function dropdown at the top, select **`initialSetup`**
3. Click ▶ **Run**
4. If asked for permissions → click **Review permissions → Allow**

This creates all the sheet tabs automatically:
`Stock_Register`, `Item_Master`, `Vendors`, `Cupboards`, `Cupboard_Items`,
`Roles`, `Users`, `Sessions`, `Notice_Board`, `Activity_Log`, `Recycle_Bin`, `Settings`

And creates the default admin account:
- **Email:** admin@sicca.com
- **Password:** Admin@1234

---

## Step 5 — Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear ⚙️ next to "Type" → select **Web app**
3. Set:
   - **Description:** SiccaSync Backend
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**
5. Copy the **Web App URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`)

---

## Step 6 — Add to .env.local

Create/open `.env.local` in your project root and add:

```
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
GEMINI_API_KEY=your_gemini_key_here
```

Then restart the dev server:
```bash
npm run dev
```

---

## ⚠️ Important: Re-deploy after code changes

Every time you edit a `.gs` file, you must:
**Deploy → New deployment** (not Manage deployments → Edit).
The URL stays the same if you use "Manage deployments → Edit existing".

---

## Test it works

Open http://localhost:9002/login and log in with:
- **Email:** admin@sicca.com
- **Password:** Admin@1234

If it logs in, you're connected! 🎉

---

## If you already have inventory data in your sheet

Share the sheet link and the column names — I can map them to the system.
