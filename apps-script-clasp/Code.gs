// ============================================================
// SiccaSync — Apps Script Backend  (FIXED v3 - clasp automated deploy)
// Deploy: Extensions → Apps Script → Deploy → New Deployment
//         Type: Web App | Execute as: Me | Access: Anyone
//
// PASTE YOUR SPREADSHEET ID BELOW (from the URL between /d/ and /edit)
// ============================================================

var SS_ID = '1SwILyP_XN6W6KG_EY7NXijziZvO_E-EWcsYx10hiBF8';

// Generic raw-tab reader/writer (listTabs / tab=X) also lives in THIS project —
// used by fetchSheetTab() / postSheetRow() on the frontend (src/lib/sheets.ts).
// 'database' must stay in sync with SS_ID above — same spreadsheet.
var SHEET_IDS = {
  register: '1txItXu7X_r_x81iSmfuxKGCkYBP0d7VAH-7g84TNPNA',
  database: SS_ID,
  testing:  '1F8uM5u9k0d9qZK5rup5V-bokPFxncH0fpfXdKru-qic'
};

function getSpreadsheet() {
  return SS_ID
    ? SpreadsheetApp.openById(SS_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function jsonResponse(result) {
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Generic raw-tab GET (sheet=.../action=listTabs or tab=...) ────────────

function handleGenericGet(e) {
  var sheetType = e.parameter.sheet;
  var action    = e.parameter.action;
  var tabName   = e.parameter.tab;

  if (!sheetType || !SHEET_IDS[sheetType]) {
    return { success: false, error: 'Invalid or missing "sheet" parameter. Must be "register", "database", or "testing".' };
  }

  var spreadsheet;
  try {
    spreadsheet = SpreadsheetApp.openById(SHEET_IDS[sheetType]);
  } catch (err) {
    return { success: false, error: 'Cannot open spreadsheet: ' + err.toString() };
  }

  if (action === 'listTabs') {
    var tabInfo = spreadsheet.getSheets().map(function(sheet) {
      var lastCol = sheet.getLastColumn();
      var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
      return { name: sheet.getName(), headers: headers };
    });
    return { success: true, sheet: sheetType, tabs: tabInfo };
  }

  if (!tabName) {
    return { success: false, error: 'Missing "tab" parameter specifying the sheet tab to read.' };
  }

  var sheet = spreadsheet.getSheetByName(tabName);
  if (!sheet) {
    return { success: false, error: 'Tab "' + tabName + '" not found in sheet "' + sheetType + '".' };
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) {
    return { success: true, sheet: sheetType, tab: tabName, data: [] };
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values  = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var data = values.map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      if (!header) return;
      var val = row[index];
      if (val instanceof Date) val = val.toISOString().split('T')[0];
      obj[header] = val;
    });
    return obj;
  });

  return { success: true, sheet: sheetType, tab: tabName, data: data };
}

// ── Generic raw-tab POST (appends a row to any tab on the "database" sheet) ──

function handleGenericPost(body) {
  var sheetType = body.sheet || 'database';
  var tabName   = body.tab;
  var rowData   = body.data || body;

  if (sheetType !== 'database') {
    return { success: false, error: 'POST writes are only permitted on the "database" sheet.' };
  }
  if (!tabName) {
    return { success: false, error: 'Missing "tab" parameter in request body.' };
  }

  var spreadsheet;
  try {
    spreadsheet = SpreadsheetApp.openById(SHEET_IDS.database);
  } catch (err) {
    return { success: false, error: 'Cannot open spreadsheet: ' + err.toString() };
  }

  var sheet = spreadsheet.getSheetByName(tabName);
  if (!sheet) {
    return { success: false, error: 'Tab "' + tabName + '" not found in database sheet.' };
  }

  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    return { success: false, error: 'Target tab is empty (no headers define structure).' };
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // ── Duplicate Write Guard (Idempotency check) ──
  var PK_MAP = {
    'Stock_Register': 'Entry_ID',
    'Item_Master': 'Item_ID',
    'Cupboards': 'Cupboard_ID',
    'Boxes': 'Box_ID',
    'Placements': 'Placement_ID',
    'Vendors': 'Vendor_ID',
    'Roles': 'Role_ID',
    'Notice_Board': 'Notice_ID',
    'Users': 'User_ID',
    'Tasks': 'Task_ID',
    'Sessions': 'Token',
    'Invoices': 'Invoice_No'
  };
  var pkColName = PK_MAP[tabName];
  if (pkColName && rowData[pkColName]) {
    var pkValue = String(rowData[pkColName]).trim();
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var pkColIndex = headers.indexOf(pkColName);
      if (pkColIndex >= 0) {
        var rawValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
        for (var r = 0; r < rawValues.length; r++) {
          var rowVals = rawValues[r];
          var existingPk = String(rowVals[pkColIndex]).trim();
          if (existingPk === pkValue) {
            // Found matching PK, check if all data fields match (ignoring date/time format variations)
            var isDup = true;
            for (var c = 0; c < headers.length; c++) {
              var h = headers[c];
              if (!h) continue;
              if (h === 'Date_Time' || h === 'Invoice_Date' || h === 'SO_Invoice_Date' || 
                  h === 'Created_On' || h === 'Last_Updated' || h === 'Updated_On' || h === 'Date') {
                continue;
              }
              var val1 = String(rowVals[c] !== undefined ? rowVals[c] : '').trim();
              var val2 = String(rowData[h] !== undefined ? rowData[h] : '').trim();
              if (val1 !== val2) {
                isDup = false;
                break;
              }
            }
            if (isDup) {
              return { 
                success: true, 
                message: 'Duplicate row write prevented (idempotent ignore) for ' + tabName + ' with ID ' + pkValue + '.', 
                appendedData: rowData,
                ignored: true 
              };
            }
          }
        }
      }
    }
  }

  var newRow = headers.map(function(header) {
    if (!header) return '';
    return rowData[header] !== undefined ? rowData[header] : '';
  });
  sheet.appendRow(newRow);

  return { success: true, message: 'Successfully appended row to ' + tabName + '.', appendedData: rowData };
}

// ── GET handler ───────────────────────────────────────────────

function doGet(e) {
  // Generic raw-tab reads (sheet=... param present) bypass the structured
  // action routing entirely — matches the old standalone google-apps-script/Code.gs.
  if (e.parameter.sheet) {
    return jsonResponse(handleGenericGet(e));
  }

  var action = (e.parameter.action || '').trim();
  var token  = (e.parameter.token  || '').trim();
  var ss, result;

  try {
    ss = getSpreadsheet();
  } catch (err) {
    return jsonResponse({ success: false, error: 'Cannot open spreadsheet: ' + err.toString() + '. Check SS_ID in Code.gs.' });
  }

  // Always ensure all sheets exist — this is the self-healing mechanism
  try { ensureSheets(ss); } catch (e2) { /* non-fatal */ }

  // On very first call (or explicit initialSetup), also seed default data
  try { seedDefaultData(ss); } catch (e3) { /* non-fatal */ }

  try {
    switch (action) {
      case 'ping':
        result = { success: true, message: 'SiccaSync Apps Script is running!', ssId: SS_ID };
        break;
      case 'initialSetup':
        result = initialSetup(ss);
        break;
      case 'freshLaunchWipe':
        result = handleFreshLaunchWipe(e.parameter.confirm, ss);
        break;
      case 'login':
        result = handleLogin(e.parameter.email, e.parameter.password, ss);
        break;
      case 'validateToken':
        result = { valid: !!validateToken(token, ss) };
        break;
      case 'dashboard':
        result = handleDashboard(token, ss);
        break;
      case 'getEntries':
        result = handleGetEntries(token, e.parameter, ss);
        break;
      case 'getItemSummary':
        result = handleGetItemSummary(token, ss);
        break;
      case 'getCupboards':
        result = handleGetCupboards(token, ss);
        break;
      case 'getCupboardItems':
        result = handleGetCupboardItems(token, e.parameter.cupboardId, ss);
        break;
      case 'getRoles':
        result = handleGetRoles(token, ss);
        break;
      case 'getUsers':
        result = handleGetUsers(token, ss);
        break;
      case 'getGSTSummary':
        result = handleGetGSTSummary(token, ss);
        break;
      case 'getNotices':
        result = handleGetNotices(token, ss);
        break;
      case 'getActivityLog':
        result = handleGetActivityLog(token, ss);
        break;
      case 'getRecycleBin':
        result = handleGetRecycleBin(token, ss);
        break;
      case 'getSettings':
        result = handleGetSettings(token, ss);
        break;
      case 'getVendors':
        result = handleGetVendors(token, ss);
        break;
      case 'getItemMaster':
        result = handleGetItemMaster(token, ss);
        break;
      default:
        result = { success: false, error: 'Unknown GET action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return jsonResponse(result);
}

// ── POST handler ──────────────────────────────────────────────

function doPost(e) {
  var body = {}, ss, result;

  try { body = JSON.parse(e.postData.contents); } catch (ex) {}

  // Generic raw-tab writes (body.tab present) bypass the structured action
  // routing entirely — matches the old standalone google-apps-script/Code.gs.
  if (body.tab) {
    return jsonResponse(handleGenericPost(body));
  }

  try {
    ss = getSpreadsheet();
  } catch (err) {
    return jsonResponse({ success: false, error: 'Cannot open spreadsheet: ' + err.toString() });
  }

  try { ensureSheets(ss); } catch (e2) {}
  try { seedDefaultData(ss); } catch (e3) {}

  var action = (body.action || '').trim();

  try {
    switch (action) {
      case 'logout':
        result = handleLogout(body.token, ss);
        break;
      case 'changePassword':
        result = handleChangePassword(body, ss);
        break;
      case 'saveInwardBatch':
        result = handleSaveInwardBatch(body, ss);
        break;
      case 'saveEntry':
        result = handleSaveEntry(body, ss);
        break;
      case 'deleteEntry':
        result = handleDeleteEntry(body, ss);
        break;
      case 'createCupboard':
        result = handleCreateCupboard(body, ss);
        break;
      case 'updateCupboard':
        result = handleUpdateCupboard(body, ss);
        break;
      case 'deleteCupboard':
        result = handleDeleteCupboard(body, ss);
        break;
      case 'addCupboardItem':
        result = handleAddCupboardItem(body, ss);
        break;
      case 'updateCupboardItem':
        result = handleUpdateCupboardItem(body, ss);
        break;
      case 'deleteCupboardItem':
        result = handleDeleteCupboardItem(body, ss);
        break;
      case 'createRole':
        result = handleCreateRole(body, ss);
        break;
      case 'updateRole':
        result = handleUpdateRole(body, ss);
        break;
      case 'deleteRole':
        result = handleDeleteRole(body, ss);
        break;
      case 'createUser':
        result = handleCreateUser(body, ss);
        break;
      case 'updateUser':
        result = handleUpdateUser(body, ss);
        break;
      case 'toggleUserStatus':
        result = handleToggleUserStatus(body, ss);
        break;
      case 'createNotice':
        result = handleCreateNotice(body, ss);
        break;
      case 'updateTaskStatus':
        result = handleUpdateTaskStatus(body, ss);
        break;
      case 'deleteNotice':
        result = handleDeleteNotice(body, ss);
        break;
      case 'createVendor':
        result = handleCreateVendor(body, ss);
        break;
      case 'updateVendor':
        result = handleUpdateVendor(body, ss);
        break;
      case 'createItem':
        result = handleCreateItem(body, ss);
        break;
      case 'updateItem':
        result = handleUpdateItem(body, ss);
        break;
      case 'saveSettings':
        result = handleSaveSettings(body, ss);
        break;
      case 'restoreItem':
        result = handleRestoreItem(body, ss);
        break;
      case 'emptyBin':
        result = handleEmptyBin(body, ss);
        break;
      case 'runMigrationV2':
        result = runMigrationV2(ss);
        break;
      case 'finalizeSwapV2':
        result = finalizeSwapV2(ss);
        break;
      case 'createLocationTabs':
        result = createLocationTabs(ss);
        break;
      default:
        result = { success: false, error: 'Unknown POST action: ' + action };
    }
  } catch (err) {
    result = { success: false, error: err.toString() };
  }

  return jsonResponse(result);
}

// ── seedDefaultData — runs silently, only inserts if empty ────
// Called automatically on every request — safe because it checks first

function seedDefaultData(ss) {
  // Seed Super Admin role
  var rolesSheet = ss.getSheetByName('Roles');
  if (rolesSheet && rolesSheet.getLastRow() < 2) {
    var allPerms = {};
    ['perm_view_inventory','perm_add_inward','perm_add_outward','perm_edit_entries','perm_delete_entries',
     'perm_view_price','perm_view_gst','perm_gst_summary','perm_export_data','perm_notice_board',
     'perm_user_management','perm_role_management','perm_recycle_bin','perm_app_settings',
     'perm_alert_config','perm_register_builder','perm_field_builder','perm_dev_tools']
    .forEach(function(p) { allPerms[p] = true; });
    rolesSheet.appendRow(['ROL-super-admin', 'Super Admin', 'Full system access',
      JSON.stringify(allPerms), formatDateTime()]);
    rolesSheet.appendRow(['ROL-warehouse', 'Warehouse Staff', 'Manage stock entries',
      JSON.stringify({perm_view_inventory:true,perm_add_inward:true,perm_add_outward:true}), formatDateTime()]);
    rolesSheet.appendRow(['ROL-viewer', 'Viewer', 'Read-only access',
      JSON.stringify({perm_view_inventory:true}), formatDateTime()]);
  }

  // Seed default admin user (password: Admin@1234)
  var usersSheet = ss.getSheetByName('Users');
  if (usersSheet && usersSheet.getLastRow() < 2) {
    usersSheet.appendRow([
      'USR-001', 'Admin User', 'admin@sicca.com', hashPassword('Admin@1234'),
      'EMP001', 'Admin Office', 'Super Admin', 'Active', 'Admin', '', 'YES', 'NO',
      formatDateTime(), ''
    ]);
  }

  // Seed default settings
  var settingsSheet = ss.getSheetByName('Settings');
  if (settingsSheet && settingsSheet.getLastRow() < 2) {
    settingsSheet.appendRow(['appName', 'SiccaSync', formatDateTime()]);
    settingsSheet.appendRow(['orgName', 'Sicca Automation India Pvt. Ltd.', formatDateTime()]);
  }
}

// ── initialSetup — can also be called manually ────────────────

function initialSetup(ss) {
  ss = ss || getSpreadsheet();
  ensureSheets(ss);
  seedDefaultData(ss);

  // Write a fresh demo-admin-token session so the app can log in immediately
  try {
    var sessSheet = ss.getSheetByName('Sessions');
    if (sessSheet) {
      deleteRowById(sessSheet, 'Token', 'demo-admin-token');
      var expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      sessSheet.appendRow([
        'demo-admin-token', 'USR-001', 'admin@sicca.com', 'Super Admin',
        'Admin User', expires.toISOString(), formatDateTime()
      ]);
    }
  } catch (e) {}

  return { success: true, message: 'Setup complete! Login: admin@sicca.com / Admin@1234' };
}
