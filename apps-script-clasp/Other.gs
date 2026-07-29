// ============================================================
// Other.gs — Cupboards, Roles, Notices, Settings, Dashboard, Setup
// NOTE: Vendor, ItemMaster, and GST handlers live in Inventory.gs
// ============================================================

var CUPBOARD_HEADERS = [
  'Cupboard_ID','Cupboard_Number','Name','Location','Description',
  'Image_URL','Color','Status','Created_On','Type'
];
var CUP_ITEM_HEADERS = [
  'Item_ID','Cupboard_ID','Item_Name','Item_Code','Category',
  'Quantity','Unit','Min_Qty','Image_URL','Description','Last_Updated'
];
var ROLE_HEADERS    = ['Role_ID','Name','Description','Permissions','Created_On'];
var NOTICE_HEADERS  = ['Notice_ID','Title','Content','Priority','Posted_By','Date_Time','Expiry'];
var LOG_HEADERS     = ['Log_ID','User_ID','User_Name','Action','Target','Date_Time'];
var BIN_HEADERS     = ['Bin_ID','Original_ID','Type','Item_Name','Deleted_By','Date_Time','Data'];
var BOX_HEADERS     = ['Box_ID', 'Cupboard_ID', 'Box_Name', 'Description', 'Created_On'];
var PLACEMENT_HEADERS = ['Placement_ID', 'Item_Code', 'Cupboard_ID', 'Box_ID', 'Quantity', 'Last_Updated'];
var SETTINGS_HEADERS = ['Key','Value','Updated_On'];
var INVOICE_HEADERS = ['Invoice_No','Vendor_Name','Date','Employee_Name','Total_Value','Created_On'];
var TASK_HEADERS    = ['Task_ID','Assigned_To_User_ID','Text','Created_By','Notice_ID','Status','Created_On'];

// ── ensureSheets — auto-creates every missing sheet ──────────
// Called on EVERY request so the system is always self-healing

function ensureSheets(ss) {
  getOrCreateSheet(ss, 'Users',          USER_HEADERS);
  getOrCreateSheet(ss, 'Sessions',       SESSION_HEADERS);
  getOrCreateSheet(ss, 'Stock_Register', STOCK_HEADERS);
  getOrCreateSheet(ss, 'Item_Master',    ITEM_MASTER_HEADERS);
  getOrCreateSheet(ss, 'Vendors',        VENDOR_HEADERS);
  getOrCreateSheet(ss, 'Cupboards',      CUPBOARD_HEADERS);
  getOrCreateSheet(ss, 'Cupboard_Items', CUP_ITEM_HEADERS);
  getOrCreateSheet(ss, 'Roles',          ROLE_HEADERS);
  getOrCreateSheet(ss, 'Notice_Board',   NOTICE_HEADERS);
  getOrCreateSheet(ss, 'Activity_Log',   LOG_HEADERS);
  getOrCreateSheet(ss, 'Recycle_Bin',    BIN_HEADERS);
  getOrCreateSheet(ss, 'Settings',       SETTINGS_HEADERS);
  getOrCreateSheet(ss, 'Boxes',          BOX_HEADERS);
  getOrCreateSheet(ss, 'Placements',     PLACEMENT_HEADERS);
  getOrCreateSheet(ss, 'Invoices',       INVOICE_HEADERS);
  getOrCreateSheet(ss, 'Tasks',          TASK_HEADERS);

  // Backfill new Users columns onto the existing sheet (existing users = already verified)
  ensureSheetColumns(ss.getSheetByName('Users'), [
    ['Verified', 'YES'], ['Photo_URL', ''], ['Permissions', '{}']
  ]);

  // Backfill container Type onto existing Cupboards rows — Storage Map treats
  // Cupboard/Drawer/Custom-named containers uniformly on this one tab.
  ensureSheetColumns(ss.getSheetByName('Cupboards'), [
    ['Type', 'Cupboard']
  ]);
}

// ── Cupboards ─────────────────────────────────────────────────

function handleGetCupboards(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var cups = sheetToObjects(ss.getSheetByName('Cupboards'))
    .filter(function(c) { return c.Status !== 'Deleted'; });
  var allItems = sheetToObjects(ss.getSheetByName('Cupboard_Items'));

  var enriched = cups.map(function(c) {
    var items = allItems.filter(function(i) { return i.Cupboard_ID === c.Cupboard_ID; });
    c._itemCount = items.length;
    c._totalQty  = items.reduce(function(s, i) { return s + parseFloat(i.Quantity || 0); }, 0);
    c._lowStock  = items.filter(function(i) {
      return parseFloat(i.Quantity || 0) <= parseFloat(i.Min_Qty || 0) && parseFloat(i.Min_Qty || 0) > 0;
    }).length;
    return c;
  });

  return { success: true, cupboards: enriched };
}

function handleGetCupboardItems(token, cupboardId, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var items = sheetToObjects(ss.getSheetByName('Cupboard_Items'));
  if (cupboardId) items = items.filter(function(i) { return i.Cupboard_ID === cupboardId; });
  return { success: true, items: items };
}

function handleCreateCupboard(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Cupboards');
  var id = generateId('CUP');
  sheet.appendRow([
    id, body.number || '', body.name || '', body.location || '',
    body.description || '', body.imageUrl || '', body.color || '#1B3A6B',
    'Active', formatDateTime(), body.type || 'Cupboard'
  ]);
  logActivity(ss, caller.id, caller.name, 'CREATE_CUPBOARD', body.name);
  return { success: true, cupboardId: id };
}

function handleUpdateCupboard(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Cupboards');
  if (!sheet) return errResponse('Cupboards sheet not found.');
  updateRowById(sheet, 'Cupboard_ID', body.cupboardId, {
    Cupboard_Number: body.number,
    Name: body.name,
    Location: body.location,
    Description: body.description,
    Color: body.color,
    Image_URL: body.imageUrl
  });
  logActivity(ss, caller.id, caller.name, 'UPDATE_CUPBOARD', body.cupboardId);
  return { success: true };
}

function handleDeleteCupboard(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  // Soft-delete the cupboard
  var sheet = ss.getSheetByName('Cupboards');
  if (sheet) updateRowById(sheet, 'Cupboard_ID', body.cupboardId, { Status: 'Deleted' });

  // Hard-delete its items
  var itemSheet = ss.getSheetByName('Cupboard_Items');
  if (itemSheet) {
    var data = itemSheet.getDataRange().getValues();
    var cupCol = data[0].indexOf('Cupboard_ID');
    for (var i = data.length - 1; i >= 1; i--) {
      if (String(data[i][cupCol]) === body.cupboardId) itemSheet.deleteRow(i + 1);
    }
  }
  logActivity(ss, caller.id, caller.name, 'DELETE_CUPBOARD', body.cupboardId);
  return { success: true };
}

function handleAddCupboardItem(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Cupboard_Items');
  var id = generateId('CIT');
  sheet.appendRow([
    id, body.cupboardId || '', body.itemName || '', body.itemCode || '',
    body.category || '', parseFloat(body.quantity || 0), body.unit || 'pcs',
    parseFloat(body.minQty || 0), body.imageUrl || '', body.description || '',
    formatDateTime()
  ]);
  logActivity(ss, caller.id, caller.name, 'ADD_CUP_ITEM', body.itemName);
  return { success: true, itemId: id };
}

function handleUpdateCupboardItem(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Cupboard_Items');
  if (!sheet) return errResponse('Cupboard_Items sheet not found.');
  updateRowById(sheet, 'Item_ID', body.itemId, {
    Item_Name: body.itemName, Item_Code: body.itemCode,
    Category: body.category, Quantity: body.quantity,
    Unit: body.unit, Min_Qty: body.minQty,
    Description: body.description, Last_Updated: formatDateTime()
  });
  return { success: true };
}

function handleDeleteCupboardItem(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Cupboard_Items');
  if (sheet) deleteRowById(sheet, 'Item_ID', body.itemId);
  return { success: true };
}

// ── Roles ─────────────────────────────────────────────────────

function handleGetRoles(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  var roles = sheetToObjects(ss.getSheetByName('Roles'));
  return { success: true, roles: roles };
}

function handleCreateRole(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Roles');
  var id = generateId('ROL');
  sheet.appendRow([
    id, body.name || '', body.description || '',
    JSON.stringify(body.permissions || {}), formatDateTime()
  ]);
  logActivity(ss, caller.id, caller.name, 'CREATE_ROLE', body.name);
  return { success: true, roleId: id };
}

function handleUpdateRole(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Roles');
  if (!sheet) return errResponse('Roles sheet not found.');
  updateRowById(sheet, 'Role_ID', body.roleId, {
    Name: body.name,
    Description: body.description,
    Permissions: JSON.stringify(body.permissions || {})
  });
  logActivity(ss, caller.id, caller.name, 'UPDATE_ROLE', body.name);
  return { success: true };
}

function handleDeleteRole(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Roles');
  if (sheet) deleteRowById(sheet, 'Role_ID', body.roleId);
  logActivity(ss, caller.id, caller.name, 'DELETE_ROLE', body.roleId);
  return { success: true };
}

// ── Notices ───────────────────────────────────────────────────

function handleGetNotices(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  var notices = sheetToObjects(ss.getSheetByName('Notice_Board')).reverse();
  return { success: true, notices: notices };
}

function handleCreateNotice(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Notice_Board');
  var id = generateId('NOT');
  sheet.appendRow([
    id, body.title || '', body.content || '',
    body.priority || 'info', caller.name || 'Admin',
    formatDateTime(), body.expiry || ''
  ]);
  logActivity(ss, caller.id, caller.name, 'POST_NOTICE', body.title);
  return { success: true, noticeId: id };
}

function handleDeleteNotice(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Notice_Board');
  if (sheet) deleteRowById(sheet, 'Notice_ID', body.noticeId);
  return { success: true };
}

// ── Activity Log ──────────────────────────────────────────────

function handleGetActivityLog(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  var logs = sheetToObjects(ss.getSheetByName('Activity_Log')).reverse().slice(0, 200);
  return { success: true, logs: logs };
}

// ── Recycle Bin ───────────────────────────────────────────────

function handleGetRecycleBin(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  var items = sheetToObjects(ss.getSheetByName('Recycle_Bin')).reverse();
  return { success: true, items: items };
}

function handleRestoreItem(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var binSheet   = ss.getSheetByName('Recycle_Bin');
  var stockSheet = ss.getSheetByName('Stock_Register');
  if (!binSheet || !stockSheet) return errResponse('Required sheet not found.');

  var rows = sheetToObjects(binSheet);
  var item = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Bin_ID === body.binId || rows[i].Original_ID === body.binId) {
      item = rows[i]; break;
    }
  }
  if (!item) return errResponse('Item not found in recycle bin.');

  try {
    var originalData = JSON.parse(item.Data || '{}');
    var headers = stockSheet.getRange(1, 1, 1, stockSheet.getLastColumn()).getValues()[0];
    var row = headers.map(function(h) { return originalData[h] || ''; });
    stockSheet.appendRow(row);
  } catch (e) {
    return errResponse('Failed to parse original data: ' + e.toString());
  }

  deleteRowById(binSheet, 'Bin_ID', item.Bin_ID);
  logActivity(ss, caller.id, caller.name, 'RESTORE_ITEM', item.Item_Name || body.binId);
  return { success: true };
}

function handleEmptyBin(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Recycle_Bin');
  if (sheet && sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  logActivity(ss, caller.id, caller.name, 'EMPTY_BIN', 'Recycle bin emptied');
  return { success: true };
}

// ── Settings ──────────────────────────────────────────────────

function handleGetSettings(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var rows = sheetToObjects(ss.getSheetByName('Settings'));
  var settings = {};
  rows.forEach(function(r) { if (r.Key) settings[r.Key] = r.Value; });

  // Apply defaults if missing
  if (!settings.appName) settings.appName = 'SiccaSync';
  if (!settings.orgName) settings.orgName = 'Sicca Automation India Pvt. Ltd.';
  return { success: true, settings: settings };
}

function handleSaveSettings(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Settings');
  var settings = body.settings || {};
  var rows = sheetToObjects(sheet);

  Object.keys(settings).forEach(function(key) {
    var val = settings[key];
    var existing = rows.find(function(r) { return r.Key === key; });
    if (existing) {
      updateRowById(sheet, 'Key', key, { Value: val, Updated_On: formatDateTime() });
    } else {
      sheet.appendRow([key, val, formatDateTime()]);
    }
  });
  return { success: true };
}

// ── Dashboard ─────────────────────────────────────────────────

function handleDashboard(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var entries     = sheetToObjects(ss.getSheetByName('Stock_Register'));
  var masterItems = sheetToObjects(ss.getSheetByName('Item_Master'))
    .filter(function(i) { return i.Status !== 'Deleted'; });

  var balMap = {};
  entries.forEach(function(e) {
    var key = (e.Item_Code || e.Item_Name || '').trim();
    if (!key) return;
    if (!balMap[key]) balMap[key] = {
      name: e.Item_Name || key, code: e.Item_Code || '',
      location: e.Location || '', balance: 0, minQty: 0
    };
    balMap[key].balance += parseFloat(e.Inward_Qty  || 0);
    balMap[key].balance -= parseFloat(e.Outward_Qty || 0);
  });

  masterItems.forEach(function(im) {
    var key = (im.Item_Code || im.Item_Name || '').trim();
    if (!key) return;
    if (!balMap[key]) balMap[key] = {
      name: im.Item_Name || key, code: im.Item_Code || '',
      location: im.Location || '', balance: 0, minQty: parseFloat(im.Min_Stock || 0)
    };
    else balMap[key].minQty = parseFloat(im.Min_Stock || 0);
  });

  var items = Object.keys(balMap).map(function(k) {
    var i = balMap[k];
    return {
      name: i.name, code: i.code, location: i.location, balance: i.balance,
      status: i.balance <= 0 ? 'Out of Stock'
            : (i.minQty > 0 && i.balance <= i.minQty) ? 'Low'
            : 'Normal'
    };
  });

  var todayPfx = formatDateTime().split(' ')[0];
  var todayCount = entries.filter(function(e) {
    return (e.Date_Time || '').startsWith(todayPfx);
  }).length;

  return {
    success: true,
    stats: {
      totalItems:  items.length,
      lowStock:    items.filter(function(i) { return i.status === 'Low'; }).length,
      outOfStock:  items.filter(function(i) { return i.status === 'Out of Stock'; }).length,
      todayCount:  todayCount,
      items:       items,
      recentEntries: entries.slice().reverse().slice(0, 10)
    }
  };
}

function runMigrationV2(ss) {
  ss = ss || getSpreadsheet();
  
  // 1. Define headers
  var masterV2Headers = [
    'Item_ID', 'Item_Name', 'Item_Code', 'HSN_Code', 'Category', 'Unit', 
    'Min_Stock', 'Max_Stock', 'Reorder_Level', 'Location', 'Image_URL', 
    'Description', 'Status', 'Created_On', 'Last_Updated'
  ];
  var cupV2Headers = [
    'Item_ID', 'Cupboard_ID', 'Item_Code', 'Min_Qty', 'Image_URL', 'Description', 'Last_Updated'
  ];

  // 2. Create or Clear Item_Master_v2
  var masterV2Sheet = ss.getSheetByName('Item_Master_v2');
  if (masterV2Sheet) {
    masterV2Sheet.clear();
  } else {
    masterV2Sheet = ss.insertSheet('Item_Master_v2');
  }
  var r = masterV2Sheet.getRange(1, 1, 1, masterV2Headers.length);
  r.setValues([masterV2Headers]);
  r.setFontWeight('bold');
  r.setBackground('#1B3A6B');
  r.setFontColor('#FFFFFF');
  masterV2Sheet.setFrozenRows(1);

  // 3. Create or Clear Cupboard_Items_v2
  var cupV2Sheet = ss.getSheetByName('Cupboard_Items_v2');
  if (cupV2Sheet) {
    cupV2Sheet.clear();
  } else {
    cupV2Sheet = ss.insertSheet('Cupboard_Items_v2');
  }
  var rCup = cupV2Sheet.getRange(1, 1, 1, cupV2Headers.length);
  rCup.setValues([cupV2Headers]);
  rCup.setFontWeight('bold');
  rCup.setBackground('#1B3A6B');
  rCup.setFontColor('#FFFFFF');
  cupV2Sheet.setFrozenRows(1);

  // 4. Fetch existing Item_Master
  var masterSheet = ss.getSheetByName('Item_Master');
  var masterRows = masterSheet ? sheetToObjects(masterSheet) : [];

  // 5. Fetch existing Cupboard_Items
  var cupSheet = ss.getSheetByName('Cupboard_Items');
  var cupRows = cupSheet ? sheetToObjects(cupSheet) : [];

  // Lookup maps
  var nameToItem = {};
  var oldCodeToItem = {};
  
  var finalItems = [];
  var newItemsMap = {};
  var masterSeqCount = 0;
  var pad = function(n) { return String(n).padStart(4, '0'); };

  // Renumber existing items (specifically the 1 demo item is mapped to ITM-0000)
  masterRows.forEach(function(item) {
    var oldId = item.Item_ID;
    var oldCode = item.Item_Code;
    var newId = 'ITM-0000'; // Row 1 gets ITM-0000
    
    var updatedItem = Object.assign({}, item, {
      Item_ID: newId,
      Item_Code: newId
    });
    
    finalItems.push(updatedItem);
    
    if (item.Item_Name) nameToItem[String(item.Item_Name).trim().toLowerCase()] = updatedItem;
    if (oldId) nameToItem[String(oldId).trim().toLowerCase()] = updatedItem;
    if (oldCode) oldCodeToItem[String(oldCode).trim()] = updatedItem;
  });

  // Find unique unmatched names from Cupboard_Items
  var unmatchedNames = [];
  cupRows.forEach(function(row) {
    var name = String(row.Item_Name || '').trim();
    if (!name || name === 'demo' || name === 'DELETED') return;
    if (!nameToItem[name.toLowerCase()]) {
      if (unmatchedNames.indexOf(name) === -1) {
        unmatchedNames.push(name);
      }
    }
  });

  unmatchedNames.sort();

  // Create new Item_Master entries sequentially (ITM-0001, ITM-0002...)
  unmatchedNames.forEach(function(name) {
    masterSeqCount++;
    var newId = 'ITM-' + pad(masterSeqCount);
    var newItem = {
      Item_ID: newId,
      Item_Name: name,
      Item_Code: newId,
      HSN_Code: '',
      Category: 'Uncategorized',
      Unit: 'pcs',
      Min_Stock: '0',
      Max_Stock: '0',
      Reorder_Level: '0',
      Location: 'Default',
      Image_URL: '',
      Description: 'auto-created from Cupboard_Items migration',
      Status: 'Needs Review',
      Created_On: formatDateTime(),
      Last_Updated: formatDateTime()
    };
    finalItems.push(newItem);
    newItemsMap[name.toLowerCase()] = newItem;
  });

  // Write to Item_Master_v2
  var masterV2Rows = finalItems.map(function(item) {
    return masterV2Headers.map(function(h) {
      return item[h] !== undefined ? item[h] : '';
    });
  });
  if (masterV2Rows.length > 0) {
    masterV2Sheet.getRange(2, 1, masterV2Rows.length, masterV2Headers.length).setValues(masterV2Rows);
  }

  // 6. Migrate Cupboard_Items to Cupboard_Items_v2
  var ciIdNum = 0;
  var migratedCupRows = [];
  cupRows.forEach(function(row) {
    ciIdNum++;
    var newCiId = 'CI-' + pad(ciIdNum);

    var name = String(row.Item_Name || '').trim();
    var code = String(row.Item_Code || '').trim();
    var finalCode = '';

    if (name && nameToItem[name.toLowerCase()]) {
      finalCode = nameToItem[name.toLowerCase()].Item_Code;
    } else if (name && newItemsMap[name.toLowerCase()]) {
      finalCode = newItemsMap[name.toLowerCase()].Item_Code;
    } else if (code && oldCodeToItem[code]) {
      finalCode = oldCodeToItem[code].Item_Code;
    } else if (code) {
      finalCode = code;
    }

    var newCupRow = [
      newCiId,
      row.Cupboard_ID || '',
      finalCode,
      row.Min_Qty !== undefined ? row.Min_Qty : '0',
      row.Image_URL || '',
      row.Description || '',
      row.Last_Updated || formatDateTime()
    ];
    migratedCupRows.push(newCupRow);
  });

  if (migratedCupRows.length > 0) {
    cupV2Sheet.getRange(2, 1, migratedCupRows.length, cupV2Headers.length).setValues(migratedCupRows);
  }

  return {
    success: true,
    masterV2Count: masterV2Rows.length,
    cupV2Count: migratedCupRows.length,
    masterV2Sample: masterV2Rows.slice(0, 10),
    cupV2Sample: migratedCupRows.slice(0, 10)
  };
}

function finalizeSwapV2(ss) {
  ss = ss || getSpreadsheet();
  
  // 1. Rename existing sheets to OLD
  var itemMaster = ss.getSheetByName('Item_Master');
  if (itemMaster) {
    var oldItemMasterTab = ss.getSheetByName('Item_Master_OLD');
    if (oldItemMasterTab) {
      ss.deleteSheet(oldItemMasterTab);
    }
    itemMaster.setName('Item_Master_OLD');
  }
  
  var cupboardItems = ss.getSheetByName('Cupboard_Items');
  if (cupboardItems) {
    var oldCupboardItemsTab = ss.getSheetByName('Cupboard_Items_OLD');
    if (oldCupboardItemsTab) {
      ss.deleteSheet(oldCupboardItemsTab);
    }
    cupboardItems.setName('Cupboard_Items_OLD');
  }

  // 2. Rename v2 sheets to active names
  var itemMasterV2 = ss.getSheetByName('Item_Master_v2');
  if (itemMasterV2) {
    itemMasterV2.setName('Item_Master');
  } else {
    return { success: false, error: 'Item_Master_v2 not found' };
  }

  var cupboardItemsV2 = ss.getSheetByName('Cupboard_Items_v2');
  if (cupboardItemsV2) {
    cupboardItemsV2.setName('Cupboard_Items');
  } else {
    return { success: false, error: 'Cupboard_Items_v2 not found' };
  }

  return {
    success: true,
    message: 'Tabs swapped successfully.'
  };
}

function createLocationTabs(ss) {
  ss = ss || getSpreadsheet();

  // Create Boxes sheet if not exists
  var boxesSheet = ss.getSheetByName('Boxes');
  if (!boxesSheet) {
    boxesSheet = ss.insertSheet('Boxes');
    var r = boxesSheet.getRange(1, 1, 1, BOX_HEADERS.length);
    r.setValues([BOX_HEADERS]);
    r.setFontWeight('bold');
    r.setBackground('#1B3A6B');
    r.setFontColor('#FFFFFF');
    boxesSheet.setFrozenRows(1);
  }

  // Create Placements sheet if not exists
  var placementsSheet = ss.getSheetByName('Placements');
  if (!placementsSheet) {
    placementsSheet = ss.insertSheet('Placements');
    var rPlc = placementsSheet.getRange(1, 1, 1, PLACEMENT_HEADERS.length);
    rPlc.setValues([PLACEMENT_HEADERS]);
    rPlc.setFontWeight('bold');
    rPlc.setBackground('#1B3A6B');
    rPlc.setFontColor('#FFFFFF');
    placementsSheet.setFrozenRows(1);
  }

  return {
    success: true,
    message: 'Location tabs created/checked successfully.'
  };
}
