// ============================================================
// FreshLaunch.gs — one-off destructive reset for launch.
// Single-use: refuses to run twice (Script Property guard).
// Trigger: GET ?action=freshLaunchWipe&confirm=WIPE-FRESH-LAUNCH
// Safe to delete this file after the reset is done.
// ============================================================

function handleFreshLaunchWipe(confirm, ss) {
  if (confirm !== 'WIPE-FRESH-LAUNCH') {
    return errResponse('Refusing: confirm token missing or wrong.');
  }
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('FRESH_LAUNCH_WIPE_DONE')) {
    return errResponse('Wipe already executed once. Refusing to run again.');
  }

  // 1. Full backup copy of the spreadsheet (cheap safety net)
  // ponytail: ss.copy needs no Drive scope, unlike DriveApp.makeCopy
  var backupName = 'SiccaSync BACKUP pre-wipe ' + formatDateTime();
  ss.copy(backupName);

  // 2. Wipe data rows from every tab, keep row 1 headers
  var wiped = [];
  ss.getSheets().forEach(function(sh) {
    var lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.deleteRows(2, lastRow - 1);
    }
    wiped.push(sh.getName());
  });

  // 3. Recreate exactly one Super Admin user
  initUsersSheet(ss);
  // Password scrubbed after the one-time run on 2026-07-11; this function is
  // spent (single-use property guard) and can never execute again.
  var tempPassword = 'SPENT-SEE-ADMIN';
  var userRow = {
    User_ID: 'USR-001', Full_Name: 'Admin', Email: 'interns@wfmail.in',
    Password_Hash: hashPassword(tempPassword), Employee_ID: '', Department: '',
    Role: 'Super Admin', Status: 'Active', Display_Name: 'Admin', Phone: '',
    Email_Alerts: 'YES', Force_Change: 'NO', Created_On: formatDateTime(),
    Last_Login: '', Verified: 'YES', Photo_URL: '', Permissions: ''
  };
  ss.getSheetByName('Users').appendRow(USER_HEADERS.map(function(h) {
    return userRow[h] !== undefined ? userRow[h] : '';
  }));

  props.setProperty('FRESH_LAUNCH_WIPE_DONE', 'yes');
  return {
    success: true,
    backup: backupName,
    wipedTabs: wiped,
    newUser: 'interns@wfmail.in (Super Admin, Active, Verified)'
  };
}

// Custom reusable reset function that wipes the database but keeps Roles, Settings, and the interns admin user intact.
function handleForceWipeDemoReset(confirm, ss) {
  if (confirm !== 'FORCE-WIPE-DEMO-RESET') {
    return { success: false, error: 'Refusing: confirm token missing or wrong.' };
  }
  // Single-use: this is a public endpoint that wipes data and can reset the
  // admin password — same spent-once guard as handleFreshLaunchWipe.
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('FORCE_WIPE_DEMO_DONE')) {
    return { success: false, error: 'Demo reset already executed once. Delete the FORCE_WIPE_DEMO_DONE script property to re-arm.' };
  }
  props.setProperty('FORCE_WIPE_DEMO_DONE', 'yes');

  // 1. Full backup copy of the spreadsheet (cheap safety net)
  var backupName = 'SiccaSync BACKUP pre-wipe ' + formatDateTime();
  ss.copy(backupName);

  // 2. Wipe data rows from every tab EXCEPT Users, Roles, Settings
  var wiped = [];
  var preserveTabs = ['Users', 'Roles', 'Settings'];
  ss.getSheets().forEach(function(sh) {
    var name = sh.getName();
    if (preserveTabs.indexOf(name) >= 0) {
      if (name === 'Users') {
        var lastRow = sh.getLastRow();
        if (lastRow > 1) {
          var lastCol = sh.getLastColumn();
          var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
          var emailIndex = headers.indexOf('Email');
          var rows = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();
          
          // Delete all users first
          sh.deleteRows(2, lastRow - 1);
          
          // Re-insert only the interns@wfmail.in user
          var adminRow = rows.find(function(row) {
            return String(row[emailIndex]).trim().toLowerCase() === 'interns@wfmail.in';
          });
          
          if (adminRow) {
            sh.appendRow(adminRow);
          } else {
            // Re-create the super admin if not found (with default login)
            var tempPassword = 'Admin@1234';
            var userRow = {
              User_ID: 'USR-001', Full_Name: 'Admin', Email: 'interns@wfmail.in',
              Password_Hash: hashPassword(tempPassword), Employee_ID: '', Department: '',
              Role: 'Super Admin', Status: 'Active', Display_Name: 'Admin', Phone: '',
              Email_Alerts: 'YES', Force_Change: 'NO', Created_On: formatDateTime(),
              Last_Login: '', Verified: 'YES', Photo_URL: '', Permissions: ''
            };
            sh.appendRow(headers.map(function(h) {
              return userRow[h] !== undefined ? userRow[h] : '';
            }));
          }
        }
      }
      return;
    }
    
    var lastRow = sh.getLastRow();
    if (lastRow > 1) {
      sh.deleteRows(2, lastRow - 1);
    }
    wiped.push(name);
  });

  return {
    success: true,
    backup: backupName,
    wipedTabs: wiped
  };
}
