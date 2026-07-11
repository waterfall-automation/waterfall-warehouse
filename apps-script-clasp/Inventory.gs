// ============================================================
// Inventory.gs — Stock Register, Item Master, Vendors
// ============================================================

var STOCK_HEADERS = [
  'Entry_ID','Date_Time','Item_Name','Item_Code','HSN_Code','Location',
  'Transaction_Type','Inward_Qty','Invoice_No','Invoice_Date','GRN_No','Vendor_Name',
  'Price_Per_Item','Discount_Pct','Taxable_Value','GST_Rate','CGST_Amt','SGST_Amt',
  'Total_Invoice_Value','Outward_Qty','Issued_To','SO_Invoice_No','SO_Invoice_Date',
  'Out_Price_Per_Item','Out_Taxable_Value','Out_GST_Rate','Out_CGST_Amt','Out_SGST_Amt',
  'Out_Total_Invoice_Value','Balance_Qty','Employee_Name','Received_By','Remarks'
];

var ITEM_MASTER_HEADERS = [
  'Item_ID','Item_Name','Item_Code','HSN_Code','Category','Unit',
  'Min_Stock','Max_Stock','Reorder_Level','Location','Image_URL',
  'Description','Status','Created_On','Last_Updated'
];

var VENDOR_HEADERS = [
  'Vendor_ID','Vendor_Name','Contact_Person','Phone','Email','Address',
  'GSTIN','Category','Status','Created_On','Notes'
];

function initStockSheet(ss)   { return getOrCreateSheet(ss, 'Stock_Register', STOCK_HEADERS); }
function initItemSheet(ss)    { return getOrCreateSheet(ss, 'Item_Master',    ITEM_MASTER_HEADERS); }
function initVendorSheet(ss)  { return getOrCreateSheet(ss, 'Vendors',        VENDOR_HEADERS); }

// ── Get Entries ───────────────────────────────────────────────

function handleGetEntries(token, params, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  initStockSheet(ss);
  var entries = sheetToObjects(ss.getSheetByName('Stock_Register'));

  // Filter
  var type   = params.type   || '';
  var search = (params.search || '').toLowerCase();
  var from   = params.from   || '';
  var to     = params.to     || '';

  if (type)   entries = entries.filter(function(e) { return e.Transaction_Type === type; });
  if (search) entries = entries.filter(function(e) {
    return (e.Item_Name||'').toLowerCase().indexOf(search) >= 0 ||
           (e.Item_Code||'').toLowerCase().indexOf(search) >= 0 ||
           (e.Vendor_Name||'').toLowerCase().indexOf(search) >= 0 ||
           (e.Issued_To||'').toLowerCase().indexOf(search) >= 0;
  });

  // Return newest first, limit
  var limit = parseInt(params.limit || '200');
  entries = entries.reverse().slice(0, limit);

  return { success: true, entries: entries };
}

// ── Save Entry ────────────────────────────────────────────────

function handleSaveEntry(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  initStockSheet(ss);
  var sheet = ss.getSheetByName('Stock_Register');

  var type    = body.transactionType || 'Inward';
  var inQty   = parseFloat(body.inwardQty  || 0);
  var outQty  = parseFloat(body.outwardQty || 0);
  var price   = parseFloat(body.pricePerItem || 0);
  var disc    = parseFloat(body.discountPct  || 0);
  var gstRate = parseFloat(body.gstRate      || 0);

  var taxable = inQty * price * (1 - disc / 100);
  var cgst    = taxable * gstRate / 200;
  var sgst    = cgst;
  var total   = taxable + cgst + sgst;

  // Calculate new balance
  var allEntries = sheetToObjects(sheet);
  var itemEntries = allEntries.filter(function(e) {
    return (e.Item_Code && e.Item_Code === body.itemCode) ||
           (e.Item_Name && e.Item_Name === body.itemName);
  });
  var currentBalance = 0;
  itemEntries.forEach(function(e) {
    currentBalance += parseFloat(e.Inward_Qty  || 0);
    currentBalance -= parseFloat(e.Outward_Qty || 0);
  });
  var newBalance = type === 'Inward'
    ? currentBalance + inQty
    : currentBalance - outQty;

  var id  = generateId('ENT');
  var now = body.dateTime || formatDateTime();

  sheet.appendRow([
    id, now,
    body.itemName||'', body.itemCode||'', body.hsnCode||'', body.location||'',
    type, inQty||'', body.invoiceNo||'', body.invoiceDate||'', body.grnNo||'', body.vendorName||'',
    price||'', disc||'', taxable||'', gstRate||'', cgst||'', sgst||'', total||'',
    outQty||'', body.issuedTo||'', '', '', '', '', '', '', '', '',
    newBalance, caller.name||'', body.receivedBy||'', body.remarks||''
  ]);

  logActivity(ss, caller.id, caller.name, type.toUpperCase() + '_ENTRY', body.itemName + ' × ' + (inQty||outQty));
  return { success: true, entryId: id, newBalance: newBalance };
}

// ── Delete Entry ──────────────────────────────────────────────

function handleDeleteEntry(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Stock_Register');
  if (!sheet) return errResponse('Sheet not found.');

  // Move to recycle bin first
  var entries = sheetToObjects(sheet);
  var entry = entries.find(function(e) { return e.Entry_ID === body.entryId; });
  if (entry) {
    var binSheet = getOrCreateSheet(ss, 'Recycle_Bin', BIN_HEADERS);
    binSheet.appendRow([generateId('BIN'), body.entryId, 'Stock Entry',
      entry.Item_Name, caller.name, formatDateTime(), JSON.stringify(entry)]);
  }

  deleteRowById(sheet, 'Entry_ID', body.entryId);
  logActivity(ss, caller.id, caller.name, 'DELETE_ENTRY', body.entryId);
  return { success: true };
}

// ── Item Summary ──────────────────────────────────────────────

function handleGetItemSummary(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  initStockSheet(ss);
  var entries = sheetToObjects(ss.getSheetByName('Stock_Register'));

  // Try Item_Master first
  initItemSheet(ss);
  var masterItems = sheetToObjects(ss.getSheetByName('Item_Master'))
    .filter(function(i) { return i.Status !== 'Deleted'; });

  if (masterItems.length > 0) {
    // Compute balance from register for each master item
    var summary = masterItems.map(function(item) {
      var itemEntries = entries.filter(function(e) {
        return e.Item_Code === item.Item_Code || e.Item_Name === item.Item_Name;
      });
      var balance = 0;
      itemEntries.forEach(function(e) {
        balance += parseFloat(e.Inward_Qty||0);
        balance -= parseFloat(e.Outward_Qty||0);
      });
      var reorder = parseFloat(item.Reorder_Level||0);
      var minStock = parseFloat(item.Min_Stock||0);
      return {
        name: item.Item_Name, code: item.Item_Code, balance: balance,
        location: item.Location, unit: item.Unit, minStock: minStock,
        reorderLevel: reorder, category: item.Category,
        status: balance <= 0 ? 'Out of Stock' : balance <= reorder ? 'Low' : 'Normal'
      };
    });
    return { success: true, items: summary };
  }

  // Fallback: derive from Stock_Register
  var map = {};
  entries.forEach(function(e) {
    var key = e.Item_Code || e.Item_Name;
    if (!key) return;
    if (!map[key]) map[key] = { name: e.Item_Name, code: e.Item_Code, balance: 0, location: e.Location, unit: 'pcs' };
    map[key].balance += parseFloat(e.Inward_Qty||0);
    map[key].balance -= parseFloat(e.Outward_Qty||0);
  });

  var result = Object.values(map).map(function(item) {
    return Object.assign(item, {
      status: item.balance <= 0 ? 'Out of Stock' : item.balance <= 5 ? 'Low' : 'Normal'
    });
  });
  return { success: true, items: result };
}

// ── Item Master CRUD ──────────────────────────────────────────

function handleGetItemMaster(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  initItemSheet(ss);
  var items = sheetToObjects(ss.getSheetByName('Item_Master'))
    .filter(function(i) { return i.Status !== 'Deleted'; });
  return { success: true, items: items };
}

function handleCreateItem(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  var sheet = initItemSheet(ss);
  var id = generateId('ITM');
  sheet.appendRow([
    id, body.itemName||'', body.itemCode||'', body.hsnCode||'',
    body.category||'', body.unit||'pcs',
    parseFloat(body.minStock||0), parseFloat(body.maxStock||0), parseFloat(body.reorderLevel||0),
    body.location||'', body.imageUrl||'', body.description||'',
    'Active', formatDateTime(), formatDateTime()
  ]);
  logActivity(ss, caller.id, caller.name, 'CREATE_ITEM', body.itemName);
  return { success: true, itemId: id };
}

function handleUpdateItem(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  var sheet = ss.getSheetByName('Item_Master');
  if (!sheet) return errResponse('Sheet not found.');
  var updates = {
    Item_Name: body.itemName, Item_Code: body.itemCode, HSN_Code: body.hsnCode,
    Category: body.category, Unit: body.unit, Min_Stock: body.minStock,
    Max_Stock: body.maxStock, Reorder_Level: body.reorderLevel,
    Location: body.location, Description: body.description, Last_Updated: formatDateTime()
  };
  updateRowById(sheet, 'Item_ID', body.itemId, updates);
  return { success: true };
}

// ── Vendors ───────────────────────────────────────────────────

function handleGetVendors(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  initVendorSheet(ss);
  var vendors = sheetToObjects(ss.getSheetByName('Vendors'))
    .filter(function(v) { return v.Status !== 'Deleted'; });
  return { success: true, vendors: vendors };
}

function handleCreateVendor(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  var sheet = initVendorSheet(ss);
  var id = generateId('VND');
  sheet.appendRow([
    id, body.vendorName||'', body.contactPerson||'', body.phone||'',
    body.email||'', body.address||'', body.gstin||'',
    body.category||'', 'Active', formatDateTime(), body.notes||''
  ]);
  logActivity(ss, caller.id, caller.name, 'CREATE_VENDOR', body.vendorName);
  return { success: true, vendorId: id };
}

function handleUpdateVendor(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  var sheet = ss.getSheetByName('Vendors');
  if (!sheet) return errResponse('Not found.');
  updateRowById(sheet, 'Vendor_ID', body.vendorId, {
    Vendor_Name: body.vendorName, Contact_Person: body.contactPerson,
    Phone: body.phone, Email: body.email, GSTIN: body.gstin, Notes: body.notes
  });
  return { success: true };
}

// ── GST Summary ───────────────────────────────────────────────

function handleGetGSTSummary(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  initStockSheet(ss);
  var entries = sheetToObjects(ss.getSheetByName('Stock_Register'))
    .filter(function(e) { return e.Transaction_Type === 'Inward'; });

  var byRate = {};
  entries.forEach(function(e) {
    var rate = e.GST_Rate || '0';
    if (!byRate[rate]) byRate[rate] = { rate: rate, taxable:0, cgst:0, sgst:0, total:0, count:0 };
    byRate[rate].taxable += parseFloat(e.Taxable_Value||0);
    byRate[rate].cgst    += parseFloat(e.CGST_Amt||0);
    byRate[rate].sgst    += parseFloat(e.SGST_Amt||0);
    byRate[rate].total   += parseFloat(e.Total_Invoice_Value||0);
    byRate[rate].count++;
  });

  return { success: true, summary: Object.values(byRate) };
}

function handleSaveInwardBatch(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  // 1. Validation
  if (!body.employeeName || !body.employeeName.trim()) {
    return errResponse('Employee name is required.');
  }
  var isWithInvoice = !!body.invoice;
  if (isWithInvoice) {
    if (!body.invoice.invoiceNo || !body.invoice.invoiceNo.trim()) {
      return errResponse('Invoice No is required.');
    }
    if (!body.invoice.vendorName || !body.invoice.vendorName.trim()) {
      return errResponse('Vendor Name is required.');
    }
  }
  if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
    return errResponse('No items to save.');
  }
  for (var i = 0; i < body.rows.length; i++) {
    var r = body.rows[i];
    if (!r.itemName || !r.itemName.trim()) {
      return errResponse('Item Name is required.');
    }
    var q = parseFloat(r.qty || 0);
    if (isNaN(q) || q <= 0) {
      return errResponse('Quantity must be greater than 0.');
    }
    var allocated = 0;
    if (r.locations && Array.isArray(r.locations)) {
      for (var j = 0; j < r.locations.length; j++) {
        var lq = parseFloat(r.locations[j].qty || 0);
        if (lq > 0) allocated += lq;
      }
    }
    if (allocated > q) {
      return errResponse('Allocation quantity exceeds row quantity.');
    }
  }

  // 2. Lock service
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return errResponse('Could not acquire lock. Please try again.');
  }

  try {
    initStockSheet(ss);
    initItemSheet(ss);
    initVendorSheet(ss);
    var itemMasterSheet = ss.getSheetByName('Item_Master');
    var stockRegisterSheet = ss.getSheetByName('Stock_Register');
    var placementsSheet = getOrCreateSheet(ss, 'Placements', ['Placement_ID', 'Item_Code', 'Cupboard_ID', 'Box_ID', 'Quantity', 'Last_Updated']);
    
    // Auto-create employee user if unverified/new
    if (body.isNewEmployee && body.employeeName) {
      var usersSheet = getOrCreateSheet(ss, 'Users', USER_HEADERS);
      var hasEmp = false;
      if (usersSheet.getLastRow() > 1) {
        var users = sheetToObjects(usersSheet);
        hasEmp = users.some(function(u) { return u.Full_Name === body.employeeName; });
      }
      if (!hasEmp) {
        var empId = generateId('USR');
        usersSheet.appendRow([
          empId, body.employeeName, '', '', '', '', 'Viewer', 'Active',
          body.employeeName, '', 'NO', 'NO', formatDateTime(), '', 'NO', '', '{}'
        ]);
      }
    }

    var now = body.dateTime || formatDateTime();
    var invoiceDate = isWithInvoice ? body.invoice.date : '';
    var invoiceNo = isWithInvoice ? body.invoice.invoiceNo : '';
    var vendorName = isWithInvoice ? body.invoice.vendorName : '';
    var grnNo = body.grnNo || '';
    var employeeName = body.employeeName;

    // Get existing stock entries and balances
    var allEntries = sheetToObjects(stockRegisterSheet);
    var balances = {};
    for (var j = 0; j < allEntries.length; j++) {
      var ent = allEntries[j];
      var key = (ent.Item_Code || ent.Item_Name || '').trim().toLowerCase();
      if (key) {
        var inQ = parseFloat(ent.Inward_Qty || 0);
        var outQ = parseFloat(ent.Outward_Qty || 0);
        balances[key] = (balances[key] || 0) + (inQ - outQ);
      }
    }

    // Get placements
    var placements = sheetToObjects(placementsSheet);
    var plcSeq = 0;
    for (var p = 0; p < placements.length; p++) {
      var match = String(placements[p].Placement_ID).match(/^PLC-(\d+)$/);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > plcSeq) plcSeq = num;
      }
    }

    // Process each row
    for (var i = 0; i < body.rows.length; i++) {
      var row = body.rows[i];
      var itemCode = row.itemCode;

      // Create new catalog item if isNewItem is true
      if (row.isNewItem) {
        var itemId = generateId('ITM');
        itemCode = row.itemCode || itemId;
        itemMasterSheet.appendRow([
          itemId, row.itemName, itemCode, row.hsnCode || '',
          row.category || 'Other', row.unit || 'pcs',
          0, 0, 0, row.location || 'Default', '', row.description || '',
          'Pending Review', formatDateTime(), formatDateTime()
        ]);
        logActivity(ss, caller.id, caller.name, 'CREATE_ITEM_MASTER', row.itemName);
      }

      // Format location label
      var locationLabel = '';
      if (row.locations && row.locations.length > 0) {
        locationLabel = row.locations.map(function(l) {
          return l.cupboardName + '/' + l.boxName + ' (' + l.qty + ')';
        }).join('; ');
      }

      // Calculate transaction details
      var inQty = parseFloat(row.qty || 0);
      var price = parseFloat(row.price || 0);
      var disc = parseFloat(row.discountPct || 0);
      var gstRate = parseFloat(row.gstRate || 18);

      var taxable = inQty * price * (1 - disc / 100);
      var cgst = taxable * gstRate / 200;
      var sgst = cgst;
      var total = taxable + cgst + sgst;

      // Balance
      var itemKey = (itemCode || row.itemName || '').trim().toLowerCase();
      var nameKey = (row.itemName || '').trim().toLowerCase();
      var currentBalance = balances[itemKey] || balances[nameKey] || 0;
      var newBalance = currentBalance + inQty;
      
      // Update running balances in map
      if (itemCode) balances[itemCode.trim().toLowerCase()] = newBalance;
      if (row.itemName) balances[row.itemName.trim().toLowerCase()] = newBalance;

      // Append stock register entry
      var entryId = generateId('ENT');
      stockRegisterSheet.appendRow([
        entryId, now,
        row.itemName, itemCode, row.hsnCode || '', locationLabel,
        'Inward', inQty, invoiceNo, invoiceDate, grnNo, vendorName,
        price || '', disc || '', taxable || '', gstRate || '', cgst || '', sgst || '', total || '',
        '', '', '', '', '', '', '', '', '', '',
        newBalance, caller.name || '', employeeName, row.remarks || ''
      ]);

      logActivity(ss, caller.id, caller.name, 'INWARD_ENTRY', row.itemName + ' × ' + inQty);

      // Process placements
      if (row.locations && row.locations.length > 0) {
        for (var k = 0; k < row.locations.length; k++) {
          var loc = row.locations[k];
          var locQty = parseFloat(loc.qty);
          if (locQty > 0) {
            // Find existing placement in memory
            var foundIdx = -1;
            for (var p = 0; p < placements.length; p++) {
              if (placements[p].Item_Code === itemCode &&
                  placements[p].Cupboard_ID === loc.cupboardId &&
                  placements[p].Box_ID === loc.boxId) {
                foundIdx = p;
                break;
              }
            }

            var plcTime = formatDateTime();
            if (foundIdx >= 0) {
              var existingPlc = placements[foundIdx];
              var newQty = parseFloat(existingPlc.Quantity || 0) + locQty;
              existingPlc.Quantity = String(newQty);
              existingPlc.Last_Updated = plcTime;
              
              var sheetRowIdx = foundIdx + 2;
              placementsSheet.getRange(sheetRowIdx, 5).setValue(String(newQty)); // Quantity is col 5
              placementsSheet.getRange(sheetRowIdx, 6).setValue(plcTime);       // Last_Updated is col 6
            } else {
              plcSeq++;
              var newPlcId = 'PLC-' + String(plcSeq).padStart(4, '0');
              var newPlcObj = {
                Placement_ID: newPlcId,
                Item_Code: itemCode,
                Cupboard_ID: loc.cupboardId,
                Box_ID: loc.boxId,
                Quantity: String(locQty),
                Last_Updated: plcTime
              };
              placements.push(newPlcObj);
              placementsSheet.appendRow([
                newPlcId, itemCode, loc.cupboardId, loc.boxId, String(locQty), plcTime
              ]);
            }
            logActivity(ss, caller.id, caller.name, 'ADD_PLACEMENT', 'Placed quantity ' + locQty + ' for item "' + itemCode + '" in Box ID ' + loc.boxId);
          }
        }
      }
    }

    // Save Invoice if applicable
    if (isWithInvoice) {
      var invoicesSheet = getOrCreateSheet(ss, 'Invoices', ['Invoice_No', 'Vendor_Name', 'Date', 'Employee_Name', 'Total_Value', 'Created_On']);
      invoicesSheet.appendRow([
        invoiceNo, vendorName, invoiceDate, employeeName, body.invoice.totalValue.toFixed(2), formatDateTime()
      ]);
    }

    lock.releaseLock();
    return okResponse({ count: body.rows.length });
  } catch (err) {
    lock.releaseLock();
    return errResponse('Transaction failed: ' + err.toString());
  }
}
