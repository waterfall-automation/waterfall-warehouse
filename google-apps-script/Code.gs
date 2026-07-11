// Google Apps Script for SiccaSync
// Deployed as Web App (Anyone has access)

// TODO: Implement authentication token verification (e.g. Bearer token in headers or query params) for production security.
const SHEET_IDS = {
  register: '1txItXu7X_r_x81iSmfuxKGCkYBP0d7VAH-7g84TNPNA',
  database: '1SwILyP_XN6W6KG_EY7NXijziZvO_E-EWcsYx10hiBF8',
  testing:  '1F8uM5u9k0d9qZK5rup5V-bokPFxncH0fpfXdKru-qic'
};

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const sheetType = e.parameter.sheet; // 'register', 'database', or 'testing'
    const action = e.parameter.action;   // e.g. 'listTabs'
    const tabName = e.parameter.tab;     // e.g. 'Inventory'

    if (!sheetType || !SHEET_IDS[sheetType]) {
      return jsonResponse({
        success: false,
        error: 'Invalid or missing "sheet" parameter. Must be "register", "database", or "testing".'
      });
    }

    const spreadsheetId = SHEET_IDS[sheetType];
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    // ACTION: listTabs
    if (action === 'listTabs') {
      const sheets = spreadsheet.getSheets();
      const tabInfo = sheets.map(sheet => {
        const lastCol = sheet.getLastColumn();
        let headers = [];
        if (lastCol > 0) {
          headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        }
        return {
          name: sheet.getName(),
          headers: headers
        };
      });
      return jsonResponse({
        success: true,
        sheet: sheetType,
        tabs: tabInfo
      });
    }

    // ACTION: get data from a specific tab
    if (!tabName) {
      return jsonResponse({
        success: false,
        error: 'Missing "tab" parameter specifying the sheet tab to read.'
      });
    }

    const sheet = spreadsheet.getSheetByName(tabName);
    if (!sheet) {
      return jsonResponse({
        success: false,
        error: 'Tab "' + tabName + '" not found in sheet "' + sheetType + '".'
      });
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow <= 1) {
      // Empty sheet or only headers
      return jsonResponse({
        success: true,
        sheet: sheetType,
        tab: tabName,
        data: []
      });
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    const result = values.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        if (header) {
          // Parse value (date formatting, blank strings, etc.)
          let val = row[index];
          if (val instanceof Date) {
            val = val.toISOString().split('T')[0]; // Format dates cleanly
          }
          obj[header] = val;
        }
      });
      return obj;
    });

    return jsonResponse({
      success: true,
      sheet: sheetType,
      tab: tabName,
      data: result
    });

  } catch (err) {
    return jsonResponse({
      success: false,
      error: 'GET Exception: ' + err.toString()
    });
  }
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return jsonResponse({
        success: false,
        error: 'Missing POST body contents.'
      });
    }

    const body = JSON.parse(e.postData.contents);
    const sheetType = body.sheet || 'database';
    const tabName = body.tab;
    const rowData = body.data || body; // Support nested "data" or root fields

    // Strictly enforce read-write only on the database sheet
    if (sheetType !== 'database') {
      return jsonResponse({
        success: false,
        error: 'POST writes are only permitted on the "database" sheet.'
      });
    }

    if (!tabName) {
      return jsonResponse({
        success: false,
        error: 'Missing "tab" parameter in request body.'
      });
    }

    const spreadsheetId = SHEET_IDS.database;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(tabName);

    if (!sheet) {
      return jsonResponse({
        success: false,
        error: 'Tab "' + tabName + '" not found in database sheet.'
      });
    }

    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) {
      return jsonResponse({
        success: false,
        error: 'Target tab is empty (no headers define structure).'
      });
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const newRow = headers.map(header => {
      if (!header) return '';
      return rowData[header] !== undefined ? rowData[header] : '';
    });

    sheet.appendRow(newRow);

    return jsonResponse({
      success: true,
      message: 'Successfully appended row to ' + tabName + '.',
      appendedData: rowData
    });

  } catch (err) {
    return jsonResponse({
      success: false,
      error: 'POST Exception: ' + err.toString()
    });
  }
}
