# SiccaSync — Complete Setup Guide

## What was built / fixed

| Page | Status | What changed |
|---|---|---|
| Dashboard | ✅ Fixed | Now reads real data from Google Sheets. Falls back to demo gracefully. |
| Stock Register (Inventory) | ✅ Complete | Inward + Outward entry forms, GST auto-calc, full ledger table, item summary |
| Storage Map | ✅ Complete | Cupboard grid with numbers, click → side panel shows all items with qty + images + lightbox |
| Roles | ✅ Complete | Create/edit roles with name, description, and granular checkbox permissions (18 perms, 5 groups) |
| Users | ✅ Complete | Real user list from Sheets, add/edit modal, role dropdown pulls from Roles sheet |
| GST Summary | ✅ Complete | Auto-calculated from Stock_Register, rate-wise breakup table |
| Notice Board | ✅ Complete | Post + view notices with priority levels (urgent/important/info) |
| Activity Log | ✅ Complete | Read from Activity_Log sheet |
| Recycle Bin | ✅ Complete | Read from Recycle_Bin sheet |
| Google Sheets API | ✅ New | `src/lib/sheets.ts` — service account auth, read/write any sheet |
| API Route | ✅ New | `src/app/api/sheets/route.ts` — secure server-side endpoint for all sheet ops |

---

## Step 1 — Set up Google Sheets (required)

### Option A: Google Apps Script (EASIEST)

1. Open your Google Sheet (your real inventory sheet)
2. Click **Extensions → Apps Script**
3. Paste all the `.gs` files from the old `sicca-portal/apps-script/` folder
4. Run `initialSetup()` once — this creates all required sheet tabs:
   - `Stock_Register`, `Item_Master`, `Cupboards`, `Cupboard_Items`
   - `Roles`, `Users`, `Notice_Board`, `Activity_Log`, `Recycle_Bin`
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the Web App URL

### Option B: Direct Google Sheets API

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Google Sheets API**
3. **APIs & Services → Credentials → Create Service Account**
4. Download the JSON key file
5. **Share your Google Sheet** with the service account email (Editor access)
6. Copy the Spreadsheet ID from the URL

---

## Step 2 — Add environment variables

Create a file called `.env.local` in the project root:

```env
# Option A (Apps Script):
APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec

# Option B (Direct Sheets API):
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=abc@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"

# AI (already configured):
GEMINI_API_KEY=your_key_here
```

---

## Step 3 — Set up your Google Sheet tabs

Your Google Sheet needs these tabs (exact names matter):

| Tab Name | What it stores |
|---|---|
| `Stock_Register` | All inward/outward entries (30 columns) |
| `Item_Master` | Master list of items (optional, auto-computed from register) |
| `Cupboards` | Cupboard/storage unit definitions |
| `Cupboard_Items` | Items stored in each cupboard |
| `Roles` | System roles with permission JSON |
| `Users` | User accounts (hashed passwords) |
| `Notice_Board` | Internal notices |
| `Activity_Log` | Audit trail |
| `Recycle_Bin` | Soft-deleted items |

**If you already have a real inventory sheet:** Share it with the service account and update `GOOGLE_SHEETS_ID`. The app will read from it directly.

---

## Step 4 — Run the app

```bash
cd your-project-folder
npm install
npm run dev
```

Open http://localhost:9002

---

## How the inventory link works

- **Stock Register** (`/inventory`) = the actual ledger. Every inward/outward entry is saved to `Stock_Register` tab.
- **Storage Map** (`/inventory-map`) = visual grid of physical cupboards. Items in `Cupboard_Items` tab link to locations.
- **Link between them:** When you add an inward entry, you enter the `Location` field (e.g. "Cupboard C-01"). This connects the ledger to the physical storage.
- You can also add items directly to a cupboard from the Storage Map and set quantities separately from the ledger.

---

## Roles system

The Roles page (`/roles`) lets you:
1. **Create a role** — give it a name and description
2. **Check permissions** — 18 permissions across 5 groups (Inventory, Finance, Communication, Admin, Advanced)
3. **Assign to users** — in the Users page, pick a role from the dropdown

Permissions are stored as a JSON object in the `Roles` sheet, e.g.:
```json
{ "perm_view_inventory": true, "perm_add_inward": true, "perm_gst_summary": false }
```

---

## Demo mode

If Google Sheets is not connected, **every page shows realistic demo data** so the UI is never broken. A yellow "Demo data" badge appears to remind you.

---

## If you have the real inventory Google Sheet URL

Share it here and I can:
- Pre-configure the exact column mapping
- Match your existing header names
- Set up the service account in one step
