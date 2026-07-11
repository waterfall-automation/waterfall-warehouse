// ============================================================
// Auth.gs — login, token validation, sessions, password change
// ============================================================

var USER_HEADERS = [
  'User_ID','Full_Name','Email','Password_Hash','Employee_ID',
  'Department','Role','Status','Display_Name','Phone',
  'Email_Alerts','Force_Change','Created_On','Last_Login',
  'Verified','Photo_URL','Permissions'
];
var SESSION_HEADERS = ['Token','User_ID','Email','Role','Name','Expires','Created_On'];

// ── The built-in admin that always works ──────────────────────
var BUILTIN_ADMIN = {
  id: 'USR-001', name: 'Admin User', email: 'admin@sicca.com',
  role: 'Super Admin', department: 'Admin Office', forceChange: false
};

function initUsersSheet(ss)   { return getOrCreateSheet(ss, 'Users',    USER_HEADERS);    }
function initSessionsSheet(ss){ return getOrCreateSheet(ss, 'Sessions', SESSION_HEADERS); }

// ── Login ─────────────────────────────────────────────────────

function handleLogin(email, password, ss) {
  if (!email || !password) return errResponse('Email and password required.');

  var emailLower = email.toLowerCase().trim();

  // Built-in admin — always works, writes a real session to the sheet
  if (emailLower === 'admin@sicca.com' && password === 'Admin@1234') {
    var token = 'demo-admin-token'; // constant so existing local data still loads
    // Write/refresh the session in the sheet so Apps Script accepts it
    try {
      initSessionsSheet(ss);
      var sessSheet = ss.getSheetByName('Sessions');
      // Remove old demo-admin-token row if exists
      deleteRowById(sessSheet, 'Token', token);
      var expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      sessSheet.appendRow([
        token, BUILTIN_ADMIN.id, BUILTIN_ADMIN.email, BUILTIN_ADMIN.role,
        BUILTIN_ADMIN.name, expires.toISOString(), formatDateTime()
      ]);
    } catch(e) {
      // If sheet write fails, still allow login
    }
    return { success: true, token: token, user: BUILTIN_ADMIN };
  }

  // Regular user login from Users sheet
  initUsersSheet(ss);
  var sheet = ss.getSheetByName('Users');
  var users = sheetToObjects(sheet);
  var user  = users.find(function(u) {
    return u.Email.toLowerCase() === emailLower;
  });

  if (!user) return errResponse('User not found.');
  if (user.Status !== 'Active') return errResponse('Account is inactive. Contact admin.');

  var inputHash = hashPassword(password);
  if (user.Password_Hash !== inputHash) return errResponse('Incorrect password.');

  var token   = Utilities.getUuid();
  var expires = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

  initSessionsSheet(ss);
  var sessSheet = ss.getSheetByName('Sessions');
  sessSheet.appendRow([
    token, user.User_ID, user.Email, user.Role,
    user.Display_Name || user.Full_Name, expires.toISOString(), formatDateTime()
  ]);

  updateRowById(sheet, 'User_ID', user.User_ID, { Last_Login: formatDateTime() });
  logActivity(ss, user.User_ID, user.Full_Name, 'LOGIN', 'Logged in');

  return {
    success: true, token: token,
    user: {
      id: user.User_ID, name: user.Display_Name || user.Full_Name,
      email: user.Email, role: user.Role, department: user.Department,
      forceChange: user.Force_Change === 'YES'
    }
  };
}

// ── Validate Token ────────────────────────────────────────────

function validateToken(token, ss) {
  if (!token) return null;

  // demo-admin-token is always valid — check sheet session
  var sheet = ss.getSheetByName('Sessions');
  if (!sheet) return null;
  var sessions = sheetToObjects(sheet);
  var sess = sessions.find(function(s) { return s.Token === token; });
  if (!sess) return null;
  if (new Date(sess.Expires) < new Date()) return null;
  return { id: sess.User_ID, email: sess.Email, role: sess.Role, name: sess.Name };
}

// ── Logout ────────────────────────────────────────────────────

function handleLogout(token, ss) {
  var sheet = ss.getSheetByName('Sessions');
  if (sheet) deleteRowById(sheet, 'Token', token);
  return { success: true };
}

// ── Change Password ───────────────────────────────────────────

function handleChangePassword(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  var sheet = ss.getSheetByName('Users');
  if (!sheet) return errResponse('Users sheet not found.');

  var users = sheetToObjects(sheet);
  var user  = users.find(function(u) { return u.User_ID === caller.id; });
  if (!user) return errResponse('User not found.');
  if (user.Password_Hash !== hashPassword(body.currentPassword)) return errResponse('Current password is wrong.');

  updateRowById(sheet, 'User_ID', caller.id, {
    Password_Hash: hashPassword(body.newPassword), Force_Change: 'NO'
  });
  logActivity(ss, caller.id, caller.name, 'CHANGE_PASSWORD', 'Password changed');
  return { success: true };
}

// ── User CRUD ─────────────────────────────────────────────────

function handleCreateUser(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');

  initUsersSheet(ss);
  var sheet = ss.getSheetByName('Users');
  var users = sheetToObjects(sheet);

  if (users.find(function(u) { return u.Email.toLowerCase() === (body.email||'').toLowerCase(); })) {
    return errResponse('A user with this email already exists.');
  }

  var id = generateId('USR');
  sheet.appendRow([
    id, body.fullName||'', body.email||'', hashPassword(body.password||'password123'),
    body.employeeId||'', body.department||'', body.role||'Viewer',
    'Active', body.fullName||'', body.phone||'',
    'YES', body.forceChange==='YES'?'YES':'NO', formatDateTime(), '',
    'YES', body.photoUrl||'', JSON.stringify(body.permissions||{})
  ]);

  logActivity(ss, caller.id, caller.name, 'CREATE_USER', 'Created: ' + body.email);
  return { success: true, userId: id };
}

function handleUpdateUser(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  var sheet = ss.getSheetByName('Users');
  if (!sheet) return errResponse('Users sheet not found.');

  var updates = {};
  if (body.fullName)   updates['Full_Name']   = body.fullName;
  if (body.role)       updates['Role']        = body.role;
  if (body.department) updates['Department']  = body.department;
  if (body.phone)      updates['Phone']       = body.phone;
  if (body.employeeId) updates['Employee_ID'] = body.employeeId;
  if (body.verified)   updates['Verified']    = body.verified;
  if (body.photoUrl)   updates['Photo_URL']   = body.photoUrl;
  if (body.permissions) updates['Permissions'] = JSON.stringify(body.permissions);

  var ok = updateRowById(sheet, 'User_ID', body.userId, updates);
  if (!ok) return errResponse('User not found.');
  logActivity(ss, caller.id, caller.name, 'UPDATE_USER', 'Updated: ' + body.userId);
  return { success: true };
}

function handleToggleUserStatus(body, ss) {
  var caller = validateToken(body.token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  var sheet = ss.getSheetByName('Users');
  if (!sheet) return errResponse('Users sheet not found.');
  updateRowById(sheet, 'User_ID', body.userId, { Status: body.status });
  logActivity(ss, caller.id, caller.name, 'TOGGLE_USER', body.userId + ' → ' + body.status);
  return { success: true };
}

function handleGetUsers(token, ss) {
  var caller = validateToken(token, ss);
  if (!caller) return errResponse('UNAUTHORIZED');
  initUsersSheet(ss);
  var users = sheetToObjects(ss.getSheetByName('Users'));
  return { success: true, users: users.map(function(u) {
    return {
      User_ID: u.User_ID, Full_Name: u.Full_Name, Email: u.Email,
      Employee_ID: u.Employee_ID, Department: u.Department, Role: u.Role,
      Status: u.Status, Display_Name: u.Display_Name||u.Full_Name,
      Phone: u.Phone, Last_Login: u.Last_Login, Created_On: u.Created_On,
      Verified: u.Verified||'NO', Photo_URL: u.Photo_URL||'', Permissions: u.Permissions||'{}'
    };
  })};
}
