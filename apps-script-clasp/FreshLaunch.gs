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
