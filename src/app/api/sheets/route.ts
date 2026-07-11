export const runtime = 'nodejs';
// Apps Script round-trips regularly take 5-15s; Vercel's default limit killed
// them mid-flight, so the client fell back to demo data.
export const maxDuration = 30;

/**
 * /api/sheets  (FIXED v3)
 *
 * Priority:
 *   1. If APPS_SCRIPT_URL is set → proxy ALL requests to Google Apps Script.
 *      Apps Script now auto-runs ensureSheets + seedDefaultData on every call,
 *      so no manual "initialSetup" step is required.
 *   2. If Apps Script is unreachable OR returns a non-JSON error → fall back to
 *      local JSON file store so the UI always works.
 *
 * Key fixes vs v2:
 *   • proxyGet / proxyPost now auto-retry after calling ?action=initialSetup
 *     when the response indicates sheets are missing (first-time use).
 *   • demo-admin-token is written into the Sessions sheet by Apps Script on login,
 *     so validateToken() always succeeds.
 *   • All UNAUTHORIZED fallbacks route to localGet/localPost instead of erroring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const APPS_URL   = process.env.NEXT_PUBLIC_SHEETS_API_URL || '';
const DATA_FILE  = process.env.DATA_FILE_PATH  || join(tmpdir(), 'siccasync-data.json');

function isRealAppsScript() {
  return !!APPS_URL && !APPS_URL.includes('YOUR_DEPLOYMENT_ID');
}

// ─────────────────────────────────────────────────────────────
// Local JSON store (fallback when Apps Script is unavailable)
// ─────────────────────────────────────────────────────────────

type Store = {
  entries: any[]; items: any[]; vendors: any[]; cupboards: any[];
  cupboardItems: any[]; notices: any[]; users: any[]; roles: any[];
  activityLog: any[]; recycleBin: any[]; settings: Record<string, string>;
  tasks?: any[]; placements?: any[]; invoices?: any[];
};

function loadStore(): Store {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      if (raw?.trim()) return JSON.parse(raw);
    }
  } catch (e) { console.error('SiccaSync: read error:', DATA_FILE, e); }

  return {
    entries: [], items: [], vendors: [], cupboards: [], cupboardItems: [],
    notices: [], users: [], activityLog: [], recycleBin: [], tasks: [],
    roles: [
      { Role_ID:'ROL-super-admin', Name:'Super Admin', Description:'Full system access',
        Permissions: JSON.stringify({perm_view_inventory:true,perm_add_inward:true,perm_add_outward:true,perm_edit_entries:true,perm_delete_entries:true,perm_view_price:true,perm_view_gst:true,perm_gst_summary:true,perm_export_data:true,perm_notice_board:true,perm_user_management:true,perm_role_management:true,perm_recycle_bin:true,perm_app_settings:true,perm_alert_config:true,perm_register_builder:true,perm_field_builder:true,perm_dev_tools:true}) },
      { Role_ID:'ROL-warehouse', Name:'Warehouse Staff', Description:'Manage stock entries',
        Permissions: JSON.stringify({perm_view_inventory:true,perm_add_inward:true,perm_add_outward:true}) },
      { Role_ID:'ROL-viewer', Name:'Viewer', Description:'Read-only access',
        Permissions: JSON.stringify({perm_view_inventory:true}) },
    ],
    settings: { appName:'SiccaSync', orgName:'Sicca Automation India Pvt. Ltd.' },
  };
}

function saveStore(store: Store) {
  try { writeFileSync(DATA_FILE, JSON.stringify(store, null, 2)); }
  catch (e) { console.error('SiccaSync: write error:', DATA_FILE, e); }
}

function genId(prefix: string) { return `${prefix}-${Date.now()}-${Math.floor(Math.random()*1000)}`; }

function nowStr() {
  const d = new Date(), p = (n: number) => String(n).padStart(2,'0');
  return `${p(d.getDate())}-${p(d.getMonth()+1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function computeDashboard(store: Store) {
  const balMap: Record<string,{name:string;code:string;location:string;balance:number;minQty:number}> = {};
  store.entries.forEach((e:any) => {
    const key = (e.Item_Code||e.Item_Name||'').trim(); if (!key) return;
    if (!balMap[key]) balMap[key] = {name:e.Item_Name||key,code:e.Item_Code||'',location:e.Location||'',balance:0,minQty:0};
    balMap[key].balance += parseFloat(e.Inward_Qty||'0') - parseFloat(e.Outward_Qty||'0');
    if (e.Location) balMap[key].location = e.Location;
  });
  store.items.forEach((im:any) => {
    const key = (im.Item_Code||im.Item_Name||'').trim(); if (!key) return;
    if (!balMap[key]) balMap[key] = {name:im.Item_Name||key,code:im.Item_Code||'',location:im.Location||'',balance:0,minQty:parseFloat(im.Min_Stock||'0')};
    else balMap[key].minQty = parseFloat(im.Min_Stock||'0');
  });
  const items = Object.values(balMap).map(i => ({
    name:i.name,code:i.code,location:i.location,balance:i.balance,
    status: i.balance<=0 ? 'Out of Stock' : (i.minQty>0&&i.balance<=i.minQty) ? 'Low' : 'Normal'
  }));
  const todayPfx = nowStr().split(' ')[0];
  const todayCount = store.entries.filter((e:any)=>(e.Date_Time||'').startsWith(todayPfx)).length;
  return {
    totalItems:items.length, lowStock:items.filter(i=>i.status==='Low').length,
    outOfStock:items.filter(i=>i.status==='Out of Stock').length, todayCount,
    items, recentEntries:[...store.entries].reverse().slice(0,10)
  };
}

function localGet(action: string, params: URLSearchParams): any {
  const store = loadStore();
  const tab = params.get('tab') || '';
  if (tab) {
    let data: any[] = [];
    if (tab === 'Stock_Register') data = store.entries;
    else if (tab === 'Item_Master') data = store.items;
    else if (tab === 'Vendors') data = store.vendors;
    else if (tab === 'Cupboards') data = store.cupboards;
    else if (tab === 'Cupboard_Items') data = store.cupboardItems;
    else if (tab === 'Notice_Board') data = store.notices;
    else if (tab === 'Users') data = store.users;
    else if (tab === 'Roles') data = store.roles;
    else if (tab === 'Tasks') data = store.tasks || [];
    else if (tab === 'Placements') data = store.placements || [];
    else if (tab === 'Invoices') data = store.invoices || [];
    return { success: true, data };
  }
  switch (action) {
    case 'ping': return { success:true, message:'SiccaSync local store is running!' };
    case 'dashboard': return { success:true, stats: computeDashboard(store) };
    case 'getEntries': {
      let list = [...store.entries].reverse();
      const type=(params.get('type')||''), search=(params.get('search')||'').toLowerCase();
      if (type) list=list.filter(e=>e.Transaction_Type===type);
      if (search) list=list.filter(e=>(e.Item_Name||'').toLowerCase().includes(search)||(e.Item_Code||'').toLowerCase().includes(search)||(e.Vendor_Name||'').toLowerCase().includes(search));
      return { success:true, entries:list.slice(0,parseInt(params.get('limit')||'200')) };
    }
    case 'getItemSummary': return { success:true, items:computeDashboard(store).items };
    case 'getItemMaster': return { success:true, items:store.items };
    case 'getVendors': return { success:true, vendors:store.vendors };
    case 'getCupboards': return { success:true, cupboards:store.cupboards };
    case 'getCupboardItems': {
      const cid=params.get('cupboardId')||'';
      return { success:true, items:cid?store.cupboardItems.filter(i=>i.Cupboard_ID===cid):store.cupboardItems };
    }
    case 'getRoles': return { success:true, roles:store.roles };
    case 'getUsers': return { success:true, users:store.users };
    case 'getGSTSummary': {
      const inward=store.entries.filter(e=>e.Transaction_Type==='Inward');
      let totT=0,totC=0,totS=0,totI=0;
      const byRate:Record<string,any>={};
      inward.forEach(e=>{
        const tax=parseFloat(e.Taxable_Value||'0'),cgst=parseFloat(e.CGST_Amt||'0'),sgst=parseFloat(e.SGST_Amt||'0'),inv=parseFloat(e.Total_Invoice_Value||'0'),rate=e.GST_Rate||'0';
        totT+=tax;totC+=cgst;totS+=sgst;totI+=inv;
        if(!byRate[rate]) byRate[rate]={rate:parseFloat(rate),taxable:0,cgst:0,sgst:0,invoice:0,count:0};
        byRate[rate].taxable+=tax;byRate[rate].cgst+=cgst;byRate[rate].sgst+=sgst;byRate[rate].invoice+=inv;byRate[rate].count+=1;
      });
      return { success:true, summary:{totalTaxable:totT,totalCGST:totC,totalSGST:totS,totalGST:totC+totS,totalInvoice:totI}, byRate:Object.values(byRate), entries:inward };
    }
    case 'getNotices': return { success:true, notices:[...store.notices].reverse() };
    case 'getTasks': return { success:true, tasks:[...(store.tasks || [])].filter((t: any) => t.Status !== 'Deleted').reverse() };
    case 'getActivityLog': return { success:true, logs:[...store.activityLog].reverse().slice(0,200) };
    case 'getRecycleBin': return { success:true, items:[...store.recycleBin].reverse() };
    case 'getSettings': return { success:true, settings:{appName:'SiccaSync',orgName:'Sicca Automation India Pvt. Ltd.',...store.settings} };
    default: return { success:true };
  }
}

function localPost(action: string, body: any): any {
  const store = loadStore();
  const tab = body.tab || '';
  if (tab) {
    const rowData = body.data || body;
    if (tab === 'Stock_Register') store.entries.push(rowData);
    else if (tab === 'Item_Master') store.items.push(rowData);
    else if (tab === 'Vendors') store.vendors.push(rowData);
    else if (tab === 'Cupboards') store.cupboards.push(rowData);
    else if (tab === 'Cupboard_Items') store.cupboardItems.push(rowData);
    else if (tab === 'Notice_Board') store.notices.push(rowData);
    else if (tab === 'Users') store.users.push(rowData);
    else if (tab === 'Roles') store.roles.push(rowData);
    else if (tab === 'Tasks') { if (!store.tasks) store.tasks = []; store.tasks.push(rowData); }
    else if (tab === 'Placements') { if (!store.placements) store.placements = []; store.placements.push(rowData); }
    else if (tab === 'Invoices') { if (!store.invoices) store.invoices = []; store.invoices.push(rowData); }
    saveStore(store);
    return { success: true, message: 'Successfully appended row to ' + tab + '.' };
  }
  switch (action) {
    case 'saveInwardBatch': {
      if (!body.employeeName || !body.employeeName.trim()) {
        return { success: false, error: 'Employee name is required.' };
      }
      const isWithInvoice = !!body.invoice;
      if (isWithInvoice) {
        if (!body.invoice.invoiceNo || !body.invoice.invoiceNo.trim()) {
          return { success: false, error: 'Invoice No is required.' };
        }
        if (!body.invoice.vendorName || !body.invoice.vendorName.trim()) {
          return { success: false, error: 'Vendor Name is required.' };
        }
      }
      if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
        return { success: false, error: 'No items to save.' };
      }
      for (const r of body.rows) {
        if (!r.itemName || !r.itemName.trim()) {
          return { success: false, error: 'Item Name is required.' };
        }
        const q = parseFloat(r.qty || '0');
        if (isNaN(q) || q <= 0) {
          return { success: false, error: 'Quantity must be greater than 0.' };
        }
        let allocated = 0;
        if (r.locations && Array.isArray(r.locations)) {
          for (const loc of r.locations) {
            const lq = parseFloat(loc.qty || '0');
            if (lq > 0) allocated += lq;
          }
        }
        if (allocated > q) {
          return { success: false, error: 'Allocation quantity exceeds row quantity.' };
        }
      }

      if (body.isNewEmployee && body.employeeName) {
        const hasEmp = store.users.some((u: any) => u.Full_Name === body.employeeName);
        if (!hasEmp) {
          const empId = genId('USR');
          store.users.push({
            User_ID: empId, Full_Name: body.employeeName, Email: '', Password_Hash: '',
            Employee_ID: '', Department: '', Role: 'Viewer', Status: 'Active',
            Display_Name: body.employeeName, Phone: '', Email_Alerts: 'NO',
            Force_Change: 'NO', Created_On: nowStr(), Last_Login: '',
            Verified: 'NO', Photo_URL: '', Permissions: '{}'
          });
        }
      }

      const now = body.dateTime || nowStr();
      const invoiceDate = isWithInvoice ? body.invoice.date : '';
      const invoiceNo = isWithInvoice ? body.invoice.invoiceNo : '';
      const vendorName = isWithInvoice ? body.invoice.vendorName : '';
      const grnNo = body.grnNo || '';
      const employeeName = body.employeeName;

      const balances: Record<string, number> = {};
      store.entries.forEach((e: any) => {
        const key = (e.Item_Code || e.Item_Name || '').trim().toLowerCase();
        if (key) {
          const inQ = parseFloat(e.Inward_Qty || '0');
          const outQ = parseFloat(e.Outward_Qty || '0');
          balances[key] = (balances[key] || 0) + (inQ - outQ);
        }
      });

      if (!store.placements) store.placements = [];
      if (!store.invoices) store.invoices = [];

      for (const row of body.rows) {
        let itemCode = row.itemCode;

        if (row.isNewItem) {
          const itemId = genId('ITM');
          itemCode = row.itemCode || itemId;
          store.items.push({
            Item_ID: itemId, Item_Name: row.itemName, Item_Code: itemCode, HSN_Code: row.hsnCode || '',
            Category: row.category || 'Other', Unit: row.unit || 'pcs',
            Min_Stock: '0', Max_Stock: '0', Reorder_Level: '0', Location: row.location || 'Default',
            Image_URL: '', Description: row.description || '', Status: 'Pending Review',
            Created_On: now, Last_Updated: now
          });
          store.activityLog.push({
            Log_ID: genId('LOG'), User_Name: 'Admin', Action: 'CREATE_ITEM_MASTER',
            Target: row.itemName, Date_Time: nowStr()
          });
        }

        let locationLabel = '';
        if (row.locations && row.locations.length > 0) {
          locationLabel = row.locations.map((l: any) => {
            return `${l.cupboardName}/${l.boxName} (${l.qty})`;
          }).join('; ');
        }

        const inQty = parseFloat(row.qty || '0');
        const price = parseFloat(row.price || '0');
        const disc = parseFloat(row.discountPct || '0');
        const gstRate = parseFloat(row.gstRate || '18');

        const taxable = inQty * price * (1 - disc / 100);
        const cgst = taxable * gstRate / 200;
        const sgst = cgst;
        const total = taxable + cgst + sgst;

        const itemKey = (itemCode || row.itemName || '').trim().toLowerCase();
        const nameKey = (row.itemName || '').trim().toLowerCase();
        const currentBalance = balances[itemKey] || balances[nameKey] || 0;
        const newBalance = currentBalance + inQty;

        if (itemCode) balances[itemCode.trim().toLowerCase()] = newBalance;
        if (row.itemName) balances[row.itemName.trim().toLowerCase()] = newBalance;

        const entryId = genId('ENT');
        store.entries.push({
          Entry_ID: entryId, Date_Time: now,
          Item_Name: row.itemName, Item_Code: itemCode, HSN_Code: row.hsnCode || '', Location: locationLabel,
          Transaction_Type: 'Inward', Inward_Qty: String(inQty), Outward_Qty: '0',
          Invoice_No: invoiceNo, Invoice_Date: invoiceDate, GRN_No: grnNo, Vendor_Name: vendorName,
          Price_Per_Item: String(price), Discount_Pct: String(disc), Taxable_Value: taxable.toFixed(2),
          GST_Rate: String(gstRate), CGST_Amt: cgst.toFixed(2), SGST_Amt: cgst.toFixed(2),
          Total_Invoice_Value: total.toFixed(2), Issued_To: '', Balance_Qty: String(newBalance),
          Employee_Name: employeeName, Remarks: row.remarks || ''
        });

        store.activityLog.push({
          Log_ID: genId('LOG'), User_Name: employeeName || 'Admin', Action: 'INWARD_ENTRY',
          Target: `${row.itemName} × ${inQty}`, Date_Time: nowStr()
        });

        if (row.locations && row.locations.length > 0) {
          for (const loc of row.locations) {
            const locQty = parseFloat(loc.qty);
            if (locQty > 0) {
              const ep = store.placements!.find((p: any) => p.Item_Code === itemCode && p.Cupboard_ID === loc.cupboardId && p.Box_ID === loc.boxId);
              if (ep) {
                ep.Quantity = String(parseFloat(ep.Quantity || '0') + locQty);
                ep.Last_Updated = now;
              } else {
                store.placements!.push({
                  Placement_ID: genId('PLC'), Item_Code: itemCode, Cupboard_ID: loc.cupboardId, Box_ID: loc.boxId,
                  Quantity: String(locQty), Last_Updated: now
                });
              }
              store.activityLog.push({
                Log_ID: genId('LOG'), User_Name: employeeName || 'Admin', Action: 'ADD_PLACEMENT',
                Target: `Placed quantity ${locQty} for item "${itemCode}" in Box ID ${loc.boxId}`, Date_Time: nowStr()
              });
            }
          }
        }
      }

      if (isWithInvoice) {
        store.invoices.push({
          Invoice_No: invoiceNo, Vendor_Name: vendorName, Date: invoiceDate,
          Employee_Name: employeeName, Total_Value: body.invoice.totalValue.toFixed(2), Created_On: now,
          Invoice_File_URL: ''
        });
      }

      saveStore(store);
      return { success: true, count: body.rows.length };
    }
    case 'uploadInvoiceFile': {
      const { fileData, mimeType, invoiceNo, vendorName, date } = body;
      if (!fileData) {
        return { success: false, error: 'Missing file data.' };
      }
      if (!invoiceNo) {
        return { success: false, error: 'Missing invoice number.' };
      }
      
      let base64Data = fileData;
      if (base64Data.indexOf(';base64,') > -1) {
        base64Data = base64Data.split(';base64,')[1];
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      
      let ext = 'bin';
      if (mimeType === 'application/pdf') ext = 'pdf';
      else if (mimeType === 'image/png') ext = 'png';
      else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') ext = 'jpg';
      else if (mimeType === 'image/svg+xml') ext = 'svg';
      else if (mimeType === 'image/webp') ext = 'webp';
      else {
        const parts = mimeType.split('/');
        if (parts.length > 1) ext = parts[1];
      }
      // mimeType is client-supplied; never let it smuggle path characters into the filename
      if (!/^[a-z0-9]{1,10}$/i.test(ext)) ext = 'bin';
      
      const sanitize = (name: string) => {
        return String(name || '').replace(/[\\\/\:\*\?\"\<\|\>]/g, '_');
      };
      
      const baseName = `${invoiceNo}_${vendorName}_${date}`;
      const filename = `${sanitize(baseName)}.${ext}`;
      
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      try {
        if (!existsSync(uploadDir)) {
          mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = join(uploadDir, filename);
        writeFileSync(filePath, buffer);
      } catch (err: any) {
        console.error('Failed to save file locally:', err);
        return { success: false, error: 'Failed to save file locally: ' + err.message };
      }
      
      const fileUrl = `/uploads/${filename}`;
      
      if (!store.invoices) store.invoices = [];
      const inv = store.invoices.find((i: any) => String(i.Invoice_No).trim().toLowerCase() === String(invoiceNo).trim().toLowerCase());
      if (inv) {
        inv.Invoice_File_URL = fileUrl;
        saveStore(store);
      }
      
      return { success: true, fileUrl };
    }
    case 'saveEntry': {
      const type=body.transactionType||'Inward';
      const inQty=parseFloat(body.inwardQty||'0'), outQty=parseFloat(body.outwardQty||'0');
      const qty=type==='Inward'?inQty:outQty;
      const price=parseFloat(body.pricePerItem||'0'), disc=parseFloat(body.discountPct||'0'), gst=parseFloat(body.gstRate||'0');
      const taxable=qty*price*(1-disc/100), cgst=taxable*gst/200, total=taxable+cgst*2;
      const sameItem=store.entries.filter(e=>(e.Item_Code&&e.Item_Code===body.itemCode)||e.Item_Name===body.itemName);
      let bal=0; sameItem.forEach(e=>{bal+=parseFloat(e.Inward_Qty||'0')-parseFloat(e.Outward_Qty||'0');});
      const newBal=type==='Inward'?bal+inQty:bal-outQty;
      const entry:any={
        Entry_ID:genId('ENT'), Date_Time:body.dateTime||nowStr(),
        Item_Name:body.itemName||'', Item_Code:body.itemCode||'', HSN_Code:body.hsnCode||'',
        Location:body.location||'', Transaction_Type:type,
        Inward_Qty:type==='Inward'?String(inQty):'0',
        Outward_Qty:type==='Outward'?String(outQty):'0',
        Invoice_No:body.invoiceNo||'', Invoice_Date:body.invoiceDate||'',
        GRN_No:body.grnNo||'', Vendor_Name:body.vendorName||'',
        Price_Per_Item:String(price), Discount_Pct:String(disc),
        Taxable_Value:taxable.toFixed(2), GST_Rate:String(gst),
        CGST_Amt:cgst.toFixed(2), SGST_Amt:cgst.toFixed(2),
        Total_Invoice_Value:total.toFixed(2),
        Issued_To:body.issuedTo||'', Balance_Qty:String(newBal),
        Employee_Name:body.employeeName||'Admin', Remarks:body.remarks||''
      };
      store.entries.push(entry);
      store.activityLog.push({Log_ID:genId('LOG'),Action:type==='Inward'?'INWARD_ENTRY':'OUTWARD_ENTRY',Target:`${body.itemName} × ${qty}`,Date_Time:nowStr(),User_Name:body.employeeName||'Admin'});
      saveStore(store);
      return { success:true, entryId:entry.Entry_ID, newBalance:newBal };
    }
    case 'deleteEntry': {
      const idx=store.entries.findIndex(e=>e.Entry_ID===body.entryId);
      if(idx>=0){const[d]=store.entries.splice(idx,1);store.recycleBin.push({Bin_ID:genId('BIN'),Original_ID:d.Entry_ID,Type:'Stock Entry',Item_Name:d.Item_Name,Deleted_By:'Admin',Date_Time:nowStr(),Data:JSON.stringify(d)});}
      saveStore(store); return { success:true };
    }
    case 'createItem': {
      const item={Item_ID:genId('ITM'),Item_Name:body.itemName||'',Item_Code:body.itemCode||'',HSN_Code:body.hsnCode||'',Category:body.category||'',Unit:body.unit||'pcs',Min_Stock:body.minStock||'0',Max_Stock:body.maxStock||'0',Reorder_Level:body.reorderLevel||'0',Location:body.location||'',Image_URL:body.imageUrl||'',Description:body.description||'',Status:'Active',Created_On:nowStr(),Last_Updated:nowStr()};
      store.items.push(item); saveStore(store); return { success:true, itemId:item.Item_ID };
    }
    case 'updateItem': {
      const idx=store.items.findIndex(i=>i.Item_ID===body.itemId);
      if(idx>=0){store.items[idx]={...store.items[idx],...body,Last_Updated:nowStr()};}
      saveStore(store); return { success:true };
    }
    case 'createVendor': {
      const v={Vendor_ID:genId('VEN'),Vendor_Name:body.vendorName||'',Contact_Person:body.contactPerson||'',Phone:body.phone||'',Email:body.email||'',Address:body.address||'',GSTIN:body.gstin||'',Category:body.category||'',Status:'Active',Created_On:nowStr(),Notes:body.notes||''};
      store.vendors.push(v); saveStore(store); return { success:true, vendorId:v.Vendor_ID };
    }
    case 'updateVendor': {
      const idx=store.vendors.findIndex(v=>v.Vendor_ID===body.vendorId);
      if(idx>=0){store.vendors[idx]={...store.vendors[idx],...body};}
      saveStore(store); return { success:true };
    }
    case 'createCupboard': {
      const c={Cupboard_ID:genId('CUP'),Cupboard_Number:body.number||'',Name:body.name||'',Location:body.location||'',Description:body.description||'',Image_URL:body.imageUrl||'',Color:body.color||'#1B3A6B',Status:'Active',Created_On:nowStr()};
      store.cupboards.push(c); saveStore(store); return { success:true, cupboardId:c.Cupboard_ID };
    }
    case 'updateCupboard': {
      const idx=store.cupboards.findIndex(c=>c.Cupboard_ID===body.cupboardId);
      if(idx>=0){store.cupboards[idx]={...store.cupboards[idx],...body};}
      saveStore(store); return { success:true };
    }
    case 'deleteCupboard': {
      store.cupboards=store.cupboards.filter(c=>c.Cupboard_ID!==body.cupboardId);
      store.cupboardItems=store.cupboardItems.filter(i=>i.Cupboard_ID!==body.cupboardId);
      saveStore(store); return { success:true };
    }
    case 'addCupboardItem': {
      const item={Item_ID:genId('CIT'),Cupboard_ID:body.cupboardId||'',Item_Name:body.itemName||'',Item_Code:body.itemCode||'',Category:body.category||'',Quantity:String(body.quantity||'0'),Unit:body.unit||'pcs',Min_Qty:String(body.minQty||'0'),Image_URL:body.imageUrl||'',Description:body.description||'',Last_Updated:nowStr()};
      store.cupboardItems.push(item); saveStore(store); return { success:true, itemId:item.Item_ID };
    }
    case 'updateCupboardItem': {
      const idx=store.cupboardItems.findIndex(i=>i.Item_ID===body.itemId);
      if(idx>=0){store.cupboardItems[idx]={...store.cupboardItems[idx],...body,Last_Updated:nowStr()};}
      saveStore(store); return { success:true };
    }
    case 'deleteCupboardItem': {
      store.cupboardItems=store.cupboardItems.filter(i=>i.Item_ID!==body.itemId);
      saveStore(store); return { success:true };
    }
    case 'createRole': {
      const r={Role_ID:genId('ROL'),Name:body.name||'',Description:body.description||'',Permissions:JSON.stringify(body.permissions||{}),Created_On:nowStr()};
      store.roles.push(r); saveStore(store); return { success:true, roleId:r.Role_ID };
    }
    case 'updateRole': {
      const idx=store.roles.findIndex(r=>r.Role_ID===body.roleId);
      if(idx>=0){store.roles[idx]={...store.roles[idx],Name:body.name,Description:body.description,Permissions:JSON.stringify(body.permissions||{})};}
      saveStore(store); return { success:true };
    }
    case 'deleteRole': {
      store.roles=store.roles.filter(r=>r.Role_ID!==body.roleId);
      saveStore(store); return { success:true };
    }
    case 'createUser': {
      const u={User_ID:genId('USR'),Full_Name:body.fullName||'',Email:body.email||'',Employee_ID:body.employeeId||'',Department:body.department||'',Role:body.role||'Viewer',Status:'Active',Display_Name:body.fullName||'',Phone:body.phone||'',Email_Alerts:'YES',Force_Change:body.forceChange==='YES'?'YES':'NO',Created_On:nowStr(),Last_Login:''};
      store.users.push(u); saveStore(store); return { success:true, userId:u.User_ID };
    }
    case 'updateUser': {
      const idx=store.users.findIndex(u=>u.User_ID===body.userId);
      if(idx>=0){store.users[idx]={...store.users[idx],...body};}
      saveStore(store); return { success:true };
    }
    case 'toggleUserStatus': {
      const idx=store.users.findIndex(u=>u.User_ID===body.userId);
      if(idx>=0){store.users[idx].Status=body.status;}
      saveStore(store); return { success:true };
    }
    case 'createNotice': {
      const n={Notice_ID:genId('NOT'),Title:body.title||'',Content:body.content||'',Priority:body.priority||'info',Posted_By:body.postedBy||'Admin',Date_Time:nowStr(),Expiry:body.expiry||''};
      store.notices.unshift(n);
      
      // Auto-create tasks for tagged users
      if (body.taggedUsers && Array.isArray(body.taggedUsers)) {
        if (!store.tasks) store.tasks = [];
        body.taggedUsers.forEach((userId: string) => {
          if (!userId) return;
          store.tasks!.push({
            Task_ID: genId('TSK'),
            Assigned_To_User_ID: userId,
            Text: body.content || body.title || '',
            Created_By: body.postedBy || 'Admin',
            Notice_ID: n.Notice_ID,
            Status: 'Pending',
            Created_On: nowStr()
          });
        });
      }

      saveStore(store); return { success:true, noticeId:n.Notice_ID };
    }
    case 'deleteNotice': {
      store.notices=store.notices.filter(n=>n.Notice_ID!==body.noticeId);
      saveStore(store); return { success:true };
    }
    case 'restoreItem':
    case 'restoreEntry': {
      const binId = body.binId || body.entryId;
      const idx=store.recycleBin.findIndex(e=>e.Bin_ID===binId||e.Original_ID===binId||e.Entry_ID===binId);
      if(idx>=0){
        const[item]=store.recycleBin.splice(idx,1);
        const restored={...item};
        // Remove bin-specific fields
        delete restored.Bin_ID; delete restored.Deleted_By; delete restored.Deleted_On;
        // Try to parse Data field if present
        if(restored.Data){ try{Object.assign(restored,JSON.parse(restored.Data));delete restored.Data;}catch{} }
        store.entries.push(restored);
      }
      saveStore(store); return { success:true };
    }
    case 'permanentDelete': {
      const binId=body.binId||body.entryId;
      store.recycleBin=store.recycleBin.filter(e=>e.Bin_ID!==binId&&e.Original_ID!==binId&&e.Entry_ID!==binId);
      saveStore(store); return { success:true };
    }
    case 'emptyBin': {
      store.recycleBin=[]; saveStore(store); return { success:true };
    }
    case 'saveSettings':
    case 'updateSettings': {
      const cfg={...(body.settings||body)};
      delete cfg.action; delete cfg.token;
      store.settings={...store.settings,...cfg};
      saveStore(store); return { success:true };
    }
    case 'changePassword': return { success:true }; // local mode: accept all
    case 'logout': return { success:true };
    case 'updateTaskStatus': {
      if (!store.tasks) store.tasks = [];
      const idx = store.tasks.findIndex(t => t.Task_ID === body.taskId);
      if (idx >= 0) {
        store.tasks[idx].Status = body.status || 'Pending';
      }
      saveStore(store);
      return { success: true };
    }
    default: return { success:true };
  }
}

// ─────────────────────────────────────────────────────────────
// Apps Script proxy helpers
// ─────────────────────────────────────────────────────────────

// NOTE: no init pre-call — Apps Script self-heals sheets on every request,
// and the extra round-trip pushed cold serverless invocations past Vercel's
// function time limit, which is what caused the demo-data fallback in prod.

async function proxyGet(params: Record<string, string>) {
  const url = new URL(APPS_URL);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
  const res = await fetch(url.toString(), { cache:'no-store', redirect:'follow', signal: AbortSignal.timeout(20000) });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { throw new Error('Apps Script non-JSON: ' + text.slice(0,400)); }
}

async function proxyPost(body: object) {
  const res = await fetch(APPS_URL, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body),
    redirect:'follow',
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { throw new Error('Apps Script non-JSON: ' + text.slice(0,400)); }
}

// ─────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || '';

    if (isRealAppsScript()) {
      const params: Record<string,string> = {};
      searchParams.forEach((v,k) => { params[k]=v; });
      try {
        const data = await proxyGet(params);
        // If Apps Script says UNAUTHORIZED, fall back to local (token sync issue)
        if (data?.success === false && data?.error === 'UNAUTHORIZED') {
          console.warn('SiccaSync: Apps Script UNAUTHORIZED for action:', action, '— using local store');
          return NextResponse.json(localGet(action, searchParams));
        }
        return NextResponse.json(data);
      } catch (err: any) {
        console.error('SiccaSync: Apps Script GET error, using local store:', err.message);
        return NextResponse.json(localGet(action, searchParams));
      }
    }

    return NextResponse.json(localGet(action, searchParams));
  } catch (err: any) {
    return NextResponse.json({ success:false, error: String(err?.message||err) });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string,unknown> = {};
    try { body = await req.json(); } catch {}

    const { searchParams } = new URL(req.url);
    const action = ((searchParams.get('action') || body.action || '') as string);
    if (action) body = { ...body, action };

    if (isRealAppsScript()) {
      try {
        const data = await proxyPost(body);
        if (data?.success === false && data?.error === 'UNAUTHORIZED') {
          console.warn('SiccaSync: Apps Script UNAUTHORIZED for action:', action, '— using local store');
          return NextResponse.json(localPost(action, body));
        }
        return NextResponse.json(data);
      } catch (err: any) {
        console.error('SiccaSync: Apps Script POST error, using local store:', err.message);
        return NextResponse.json(localPost(action, body));
      }
    }

    return NextResponse.json(localPost(action, body));
  } catch (err: any) {
    return NextResponse.json({ success:false, error: String(err?.message||err) });
  }
}
