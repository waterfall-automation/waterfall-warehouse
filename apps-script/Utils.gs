// ============================================================
// Utils.gs — helpers used across all handlers
// ============================================================

// ── ID / DateTime ────────────────────────────────────────────

function generateId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function formatDateTime(d) {
  d = d || new Date();
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return pad(d.getDate()) + '-' + pad(d.getMonth()+1) + '-' + d.getFullYear()
    + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// ── Sheet helpers ─────────────────────────────────────────────

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var headerRow = sheet.getRange(1, 1, 1, headers.length);
    headerRow.setValues([headers]);
    headerRow.setFontWeight('bold');
    headerRow.setBackground('#1B3A6B');
    headerRow.setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Backfills missing columns onto an EXISTING sheet without touching current data.
// colDefs: [['ColName', defaultValueForExistingRows], ...]
function ensureSheetColumns(sheet, colDefs) {
  if (!sheet) return;
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function(h) { return String(h).trim(); });
  var lastRow = sheet.getLastRow();
  colDefs.forEach(function(def) {
    var name = def[0], defaultVal = def[1];
    if (headers.indexOf(name) !== -1) return;
    lastCol++;
    var cell = sheet.getRange(1, lastCol);
    cell.setValue(name).setFontWeight('bold').setBackground('#1B3A6B').setFontColor('#FFFFFF');
    if (lastRow > 1) sheet.getRange(2, lastCol, lastRow - 1, 1).setValue(defaultVal);
    headers.push(name);
  });
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(function(h) { return String(h).trim(); });
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = String(row[i] || '').trim(); });
    return obj;
  });
}

function appendRowObj(sheet, obj, headers) {
  var row = headers.map(function(h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.appendRow(row);
}

function findRowById(sheet, idCol, id) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var colIdx = headers.indexOf(idCol);
  if (colIdx < 0) return -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]).trim() === String(id).trim()) return i + 1; // 1-based
  }
  return -1;
}

function updateRowById(sheet, idCol, id, updates) {
  var data  = sheet.getDataRange().getValues();
  var headers = data[0];
  var colIdx  = headers.indexOf(idCol);
  if (colIdx < 0) return false;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]).trim() === String(id).trim()) {
      Object.keys(updates).forEach(function(key) {
        var hi = headers.indexOf(key);
        if (hi >= 0) sheet.getRange(i+1, hi+1).setValue(updates[key]);
      });
      return true;
    }
  }
  return false;
}

function deleteRowById(sheet, idCol, id) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var colIdx = headers.indexOf(idCol);
  if (colIdx < 0) return false;
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][colIdx]).trim() === String(id).trim()) {
      sheet.deleteRow(i+1);
      return true;
    }
  }
  return false;
}

// ── Password hashing ──────────────────────────────────────────

function hashPassword(password) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

// ── Activity Logging ──────────────────────────────────────────

function logActivity(ss, userId, userName, action, target) {
  var sheet = ss.getSheetByName('Activity_Log');
  if (!sheet) return;
  sheet.appendRow([
    generateId('LOG'), userId || '', userName || 'System',
    action, target || '', formatDateTime()
  ]);
}

// ── CORS / response helpers ───────────────────────────────────

function okResponse(data) {
  return Object.assign({ success: true }, data);
}

function errResponse(msg) {
  return { success: false, error: msg };
}
