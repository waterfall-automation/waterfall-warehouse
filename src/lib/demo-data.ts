export interface Entry {
  Entry_ID: string;
  Date_Time: string;
  Item_Name: string;
  Item_Code: string;
  Transaction_Type: 'Inward' | 'Outward' | 'Return';
  Inward_Qty: string;
  Outward_Qty: string;
  Balance_Qty: string;
  Vendor_Name: string;
  Issued_To: string;
  Invoice_No: string;
  Employee_Name: string;
  Location: string;
  Price_Per_Item: string;
  GST_Rate: string;
  Total_Invoice_Value: string;
  Remarks: string;
  Discount_Pct?: string;
}

export interface ItemSummary {
  name: string;
  code: string;
  balance: number;
  location: string;
  status: 'Normal' | 'Low' | 'Out of Stock';
}

export interface User {
  User_ID: string;
  Full_Name: string;
  Email: string;
  Role: string;
  Status: 'Active' | 'Offline';
  Department: string;
  Employee_ID: string;
  Verified?: string;
  Photo_URL?: string;
  Permissions?: string; // JSON string — { pages: {...}, <pageKey>: {...granular} }
  Phone?: string;
  Display_Name?: string;
}

export interface Role {
  Role_ID: string;
  Name: string;
  Description: string;
  Permissions: string; // JSON string
  Created_On: string;
}

export interface Notice {
  Notice_ID: string;
  Title: string;
  Content: string;
  Priority: 'urgent' | 'important' | 'info';
  Posted_By: string;
  Date_Time: string;
  Expiry: string;
}

export interface RecycleItem {
  Bin_ID: string;
  Original_ID: string;
  Type: string;
  Item_Name: string;
  Deleted_By: string;
  Date_Time: string;
}

export interface ActivityLog {
  Log_ID: string;
  User_Name: string;
  Action: string;
  Target: string;
  Date_Time: string;
}

export interface Cupboard {
  Cupboard_ID: string;
  Cupboard_Number: string;
  Name: string;
  Location: string;
  Description: string;
  Image_URL: string;
  Color: string;
  Status: string;
  Created_On?: string;
  Type?: string; // 'Cupboard' | 'Drawer' | a custom user-named type
  _itemCount?: number;
  _totalQty?: number;
  _lowStock?: number;
}

export interface CupItem {
  Item_ID: string;
  Cupboard_ID: string;
  Item_Name: string;
  Item_Code: string;
  Category: string;
  Quantity: string;
  Unit: string;
  Min_Qty: string;
  Image_URL: string;
  Description: string;
  Last_Updated?: string;
  Status?: string;
}

export interface Vendor {
  Vendor_ID: string;
  Vendor_Name: string;
  Contact_Person: string;
  Phone: string;
  Email: string;
  Address: string;
  GSTIN: string;
  Category: string;
  Status: 'Active' | 'Inactive';
  Notes?: string;
  Created_On?: string;
}

export interface ItemMaster {
  Item_ID: string;
  Item_Name: string;
  Item_Code: string;
  HSN_Code: string;
  Category: string;
  Unit: string;
  Min_Stock: string;
  Max_Stock: string;
  Reorder_Level: string;
  Location: string;
  Status: 'Active' | 'Inactive' | 'Deleted' | 'Pending Review';
  Description?: string;
  Image_URL?: string;
  Created_On?: string;
  Last_Updated?: string;
}

export interface Box {
  Box_ID: string;
  Cupboard_ID: string;
  Box_Name: string;
  Description: string;
  Created_On?: string;
}

export interface Placement {
  Placement_ID: string;
  Item_Code: string;
  Cupboard_ID: string;
  Box_ID: string;
  Quantity: string;
  Last_Updated?: string;
}

export interface Invoice {
  Invoice_No: string;
  Vendor_Name: string;
  Date: string;
  Employee_Name: string;
  Total_Value: string;
  Created_On?: string;
  Invoice_File_URL?: string;
}

// 1. INVENTORY ENTRIES
export const DEMO_INVENTORY_ENTRIES: Entry[] = [
  { Entry_ID: 'ENT-001', Date_Time: '03-07-2026 14:30', Item_Name: 'Ethernet Cable Cat6 5m', Item_Code: 'EC-005', Transaction_Type: 'Inward', Inward_Qty: '50', Outward_Qty: '0', Balance_Qty: '120', Vendor_Name: 'ElectroCorp India Pvt Ltd', Issued_To: '', Invoice_No: 'INV-2026-081', Employee_Name: 'John Doe', Location: 'Shelf A3', Price_Per_Item: '250', GST_Rate: '18', Total_Invoice_Value: '14750', Remarks: 'Restocked for Lab project' },
  { Entry_ID: 'ENT-002', Date_Time: '03-07-2026 12:15', Item_Name: 'Wireless Mouse', Item_Code: 'WM-002', Transaction_Type: 'Outward', Inward_Qty: '0', Outward_Qty: '3', Balance_Qty: '2', Vendor_Name: '', Issued_To: 'R&D Department', Invoice_No: '', Employee_Name: 'Jane Smith', Location: 'Shelf B2', Price_Per_Item: '800', GST_Rate: '18', Total_Invoice_Value: '2832', Remarks: 'Issued for new joinees' },
  { Entry_ID: 'ENT-003', Date_Time: '03-07-2026 11:00', Item_Name: 'Dell 24" Monitor', Item_Code: 'DM-024', Transaction_Type: 'Inward', Inward_Qty: '10', Outward_Qty: '0', Balance_Qty: '0', Vendor_Name: 'TechParts India', Issued_To: '', Invoice_No: 'INV-9942', Employee_Name: 'John Doe', Location: 'Row 1', Price_Per_Item: '12000', GST_Rate: '18', Total_Invoice_Value: '141600', Remarks: 'Critical procurement' },
  { Entry_ID: 'ENT-004', Date_Time: '03-07-2026 09:45', Item_Name: 'USB-C Hub 7-in-1', Item_Code: 'UH-007', Transaction_Type: 'Outward', Inward_Qty: '0', Outward_Qty: '5', Balance_Qty: '1', Vendor_Name: '', Issued_To: 'Testing Lab', Invoice_No: '', Employee_Name: 'Alice Johnson', Location: 'Shelf B4', Price_Per_Item: '1500', GST_Rate: '18', Total_Invoice_Value: '8850', Remarks: 'Setup testing setups' },
  { Entry_ID: 'ENT-005', Date_Time: '02-07-2026 16:20', Item_Name: 'Mechanical Keyboard', Item_Code: 'MK-101', Transaction_Type: 'Inward', Inward_Qty: '15', Outward_Qty: '0', Balance_Qty: '25', Vendor_Name: 'ElectroCorp India Pvt Ltd', Issued_To: '', Invoice_No: 'INV-2026-079', Employee_Name: 'Bob Wilson', Location: 'Shelf A1', Price_Per_Item: '3000', GST_Rate: '18', Total_Invoice_Value: '53100', Remarks: 'Quarterly supply' },
  { Entry_ID: 'ENT-006', Date_Time: '02-07-2026 11:10', Item_Name: 'HDMI Cable 2m', Item_Code: 'HC-002', Transaction_Type: 'Outward', Inward_Qty: '0', Outward_Qty: '10', Balance_Qty: '0', Vendor_Name: '', Issued_To: 'Admin Office', Invoice_No: '', Employee_Name: 'Jane Smith', Location: 'Shelf A4', Price_Per_Item: '180', GST_Rate: '18', Total_Invoice_Value: '2124', Remarks: 'Office setups' },
  { Entry_ID: 'ENT-007', Date_Time: '01-07-2026 14:00', Item_Name: 'Office Chair Ergonomic', Item_Code: 'OC-990', Transaction_Type: 'Inward', Inward_Qty: '8', Outward_Qty: '0', Balance_Qty: '8', Vendor_Name: 'SafeWear Solutions', Issued_To: '', Invoice_No: 'INV-9023', Employee_Name: 'Alice Johnson', Location: 'Warehouse Sec C', Price_Per_Item: '6500', GST_Rate: '12', Total_Invoice_Value: '58240', Remarks: 'For conference room' },
  { Entry_ID: 'ENT-008', Date_Time: '01-07-2026 10:30', Item_Name: 'USB Flash Drive 64GB', Item_Code: 'FD-064', Transaction_Type: 'Inward', Inward_Qty: '50', Outward_Qty: '0', Balance_Qty: '45', Vendor_Name: 'TechParts India', Issued_To: '', Invoice_No: 'INV-9930', Employee_Name: 'Bob Wilson', Location: 'Shelf B1', Price_Per_Item: '400', GST_Rate: '18', Total_Invoice_Value: '23600', Remarks: 'Standard issue stock' },
  { Entry_ID: 'ENT-009', Date_Time: '30-06-2026 16:50', Item_Name: 'Digital Multimeter', Item_Code: 'MM-102', Transaction_Type: 'Inward', Inward_Qty: '20', Outward_Qty: '0', Balance_Qty: '12', Vendor_Name: 'ElectroCorp India Pvt Ltd', Issued_To: '', Invoice_No: 'INV-2026-075', Employee_Name: 'John Doe', Location: 'Cupboard A', Price_Per_Item: '1200', GST_Rate: '18', Total_Invoice_Value: '28320', Remarks: 'Lab tools' },
  { Entry_ID: 'ENT-010', Date_Time: '30-06-2026 11:30', Item_Name: 'Safety Gloves (Heavy Duty)', Item_Code: 'SG-001', Transaction_Type: 'Outward', Inward_Qty: '0', Outward_Qty: '30', Balance_Qty: '45', Vendor_Name: '', Issued_To: 'Maintenance Dept', Invoice_No: '', Employee_Name: 'Alice Johnson', Location: 'Cupboard B', Price_Per_Item: '350', GST_Rate: '5', Total_Invoice_Value: '11025', Remarks: 'Routine safety gear replacement' },
  { Entry_ID: 'ENT-011', Date_Time: '29-06-2026 14:15', Item_Name: 'Soldering Station', Item_Code: 'SS-200', Transaction_Type: 'Inward', Inward_Qty: '5', Outward_Qty: '0', Balance_Qty: '7', Vendor_Name: 'TechParts India', Issued_To: '', Invoice_No: 'INV-9921', Employee_Name: 'Bob Wilson', Location: 'Cupboard A', Price_Per_Item: '4500', GST_Rate: '18', Total_Invoice_Value: '26550', Remarks: 'Assembly line' }
];

// 2. ITEM SUMMARY
export const DEMO_ITEM_SUMMARY: ItemSummary[] = [
  { name: 'Ethernet Cable Cat6 5m', code: 'EC-005', balance: 120, location: 'Shelf A3', status: 'Normal' },
  { name: 'Wireless Mouse', code: 'WM-002', balance: 2, location: 'Shelf B2', status: 'Low' },
  { name: 'Dell 24" Monitor', code: 'DM-024', balance: 0, location: 'Row 1', status: 'Out of Stock' },
  { name: 'USB-C Hub 7-in-1', code: 'UH-007', balance: 1, location: 'Shelf B4', status: 'Low' },
  { name: 'Mechanical Keyboard', code: 'MK-101', balance: 25, location: 'Shelf A1', status: 'Normal' },
  { name: 'HDMI Cable 2m', code: 'HC-002', balance: 0, location: 'Shelf A4', status: 'Out of Stock' },
  { name: 'Office Chair Ergonomic', code: 'OC-990', balance: 8, location: 'Warehouse Sec C', status: 'Low' },
  { name: 'USB Flash Drive 64GB', code: 'FD-064', balance: 45, location: 'Shelf B1', status: 'Normal' },
  { name: 'Digital Multimeter', code: 'MM-102', balance: 12, location: 'Cupboard A', status: 'Normal' },
  { name: 'Safety Gloves (Heavy Duty)', code: 'SG-001', balance: 45, location: 'Cupboard B', status: 'Normal' },
  { name: 'Soldering Station', code: 'SS-200', balance: 7, location: 'Cupboard A', status: 'Normal' }
];

// 3. DASHBOARD STATS
export const DEMO_DASHBOARD_STATS = {
  totalItems: 148,
  lowStock: 6,
  outOfStock: 2,
  todayCount: 9,
  recentEntries: DEMO_INVENTORY_ENTRIES.slice(0, 5),
  items: DEMO_ITEM_SUMMARY
};

// 4. USERS
export const DEMO_USERS: User[] = [
  { User_ID: 'USR001', Full_Name: 'Admin User', Email: 'admin@sicca.com', Role: 'Super Admin', Status: 'Active', Department: 'Admin', Employee_ID: 'EMP001' },
  { User_ID: 'USR002', Full_Name: 'John Doe', Email: 'john@sicca.com', Role: 'Inventory Lead', Status: 'Active', Department: 'Warehouse', Employee_ID: 'EMP002' },
  { User_ID: 'USR003', Full_Name: 'Alice Smith', Email: 'alice@sicca.com', Role: 'Viewer', Status: 'Offline', Department: 'Accounts', Employee_ID: 'EMP003' },
  { User_ID: 'USR004', Full_Name: 'Bob Wilson', Email: 'bob@sicca.com', Role: 'Inventory Operator', Status: 'Active', Department: 'Assembly', Employee_ID: 'EMP004' },
  { User_ID: 'USR005', Full_Name: 'Jane Smith', Email: 'jane@sicca.com', Role: 'Inventory Lead', Status: 'Active', Department: 'R&D', Employee_ID: 'EMP005' },
  { User_ID: 'USR006', Full_Name: 'Safety Officer', Email: 'safety@sicca.com', Role: 'Viewer', Status: 'Active', Department: 'Safety', Employee_ID: 'EMP006' }
];

// 5. ROLES (18 permissions mapped)
export const DEMO_ROLES: Role[] = [
  {
    Role_ID: 'ROL-admin',
    Name: 'Super Admin',
    Description: 'Full system access including user management and deletion.',
    Permissions: JSON.stringify({
      perm_view_inventory: true, perm_add_inward: true, perm_add_outward: true,
      perm_edit_entries: true, perm_delete_entries: true, perm_view_price: true,
      perm_view_gst: true, perm_gst_summary: true, perm_export_data: true,
      perm_notice_board: true, perm_user_management: true, perm_role_management: true,
      perm_recycle_bin: true, perm_app_settings: true, perm_alert_config: true,
      perm_register_builder: true, perm_field_builder: true, perm_dev_tools: true
    }),
    Created_On: '01-01-2026'
  },
  {
    Role_ID: 'ROL-lead',
    Name: 'Inventory Lead',
    Description: 'Can manage stock, vendors, and view GST reports.',
    Permissions: JSON.stringify({
      perm_view_inventory: true, perm_add_inward: true, perm_add_outward: true,
      perm_edit_entries: true, perm_view_price: true, perm_view_gst: true,
      perm_gst_summary: true, perm_export_data: true, perm_notice_board: true,
      perm_recycle_bin: true, perm_alert_config: true
    }),
    Created_On: '01-01-2026'
  },
  {
    Role_ID: 'ROL-operator',
    Name: 'Inventory Operator',
    Description: 'Can record stock entries but cannot edit or delete.',
    Permissions: JSON.stringify({
      perm_view_inventory: true, perm_add_inward: true, perm_add_outward: true,
      perm_view_price: true
    }),
    Created_On: '02-01-2026'
  },
  {
    Role_ID: 'ROL-viewer',
    Name: 'Viewer',
    Description: 'Read-only access to inventory and dashboards.',
    Permissions: JSON.stringify({
      perm_view_inventory: true
    }),
    Created_On: '01-01-2026'
  }
];

// 6. GST SUMMARY REPORT
export const DEMO_GST_SUMMARY = {
  summary: {
    totalTaxable: 301200,
    totalCGST: 26348,
    totalSGST: 26348,
    totalGST: 52696,
    totalInvoice: 353896
  },
  byRate: [
    { rate: 18, count: 8, taxable: 220000, cgst: 19800, sgst: 19800, invoice: 259600 },
    { rate: 12, count: 1, taxable: 51200, cgst: 3072, sgst: 3072, invoice: 57344 },
    { rate: 5, count: 2, taxable: 30000, cgst: 750, sgst: 750, invoice: 31500 }
  ]
};

// 7. NOTICES
export const DEMO_NOTICES: Notice[] = [
  { Notice_ID: '1', Title: 'Quarterly Stock Audit — Mandatory Presence', Content: 'All warehouse staff must be present for the upcoming audit starting next Monday. No leave requests will be approved.', Priority: 'urgent', Posted_By: 'Admin', Date_Time: '24-05-2026 10:00', Expiry: '30-05-2026' },
  { Notice_ID: '2', Title: 'New Safety Protocols for Chemical Storage', Content: 'Please review the updated SDS located in Cabinet-2. Proper PPE is strictly mandatory effective immediately.', Priority: 'important', Posted_By: 'Safety Officer', Date_Time: '22-05-2026 09:00', Expiry: '15-06-2026' },
  { Notice_ID: '3', Title: 'System Maintenance — Sunday 2 AM to 6 AM', Content: 'The inventory portal will be offline for database migration. Plan your entries accordingly.', Priority: 'info', Posted_By: 'IT Admin', Date_Time: '20-05-2026 15:00', Expiry: '26-05-2026' },
  { Notice_ID: '4', Title: 'Vendor Meetup 2026 Rescheduled', Content: 'The annual vendor meet is now moved to July 15th at the corporate headquarters. Invitation cards sent.', Priority: 'info', Posted_By: 'Purchasing Head', Date_Time: '18-05-2026 12:00', Expiry: '15-07-2026' },
  { Notice_ID: '5', Title: 'Disposal of Obsolete Equipment', Content: 'A scrap clearance process will begin on Wednesday. Please tag all out-of-use machinery in storage area B.', Priority: 'important', Posted_By: 'Warehouse Manager', Date_Time: '15-05-2026 14:00', Expiry: '20-05-2026' }
];

// 8. RECYCLE BIN
export const DEMO_RECYCLE_BIN: RecycleItem[] = [
  { Bin_ID: 'BIN-1', Original_ID: 'ENT-909', Type: 'Stock Entry', Item_Name: 'HDMI Cable (Old Stock) x 12', Deleted_By: 'Admin', Date_Time: '24-06-2026 10:00' },
  { Bin_ID: 'BIN-2', Original_ID: 'VND-099', Type: 'Vendor', Item_Name: 'Vendor: Old Supplier LLC', Deleted_By: 'John Doe', Date_Time: '22-06-2026 09:30' },
  { Bin_ID: 'BIN-3', Original_ID: 'ITM-991', Type: 'Item Master', Item_Name: 'CRT Monitor 15 inch', Deleted_By: 'Admin', Date_Time: '20-06-2026 11:45' }
];

// 9. ACTIVITY LOG
export const DEMO_ACTIVITY_LOG: ActivityLog[] = [
  { Log_ID: '1', User_Name: 'Admin', Action: 'LOGIN', Target: 'Logged in successfully', Date_Time: '03-07-2026 16:15' },
  { Log_ID: '2', User_Name: 'John Doe', Action: 'INWARD_ENTRY', Target: 'Ethernet Cable Cat6 5m × 50', Date_Time: '03-07-2026 14:30' },
  { Log_ID: '3', User_Name: 'Jane Smith', Action: 'OUTWARD_ENTRY', Target: 'Wireless Mouse × 3', Date_Time: '03-07-2026 12:15' },
  { Log_ID: '4', User_Name: 'John Doe', Action: 'INWARD_ENTRY', Target: 'Dell 24" Monitor × 10', Date_Time: '03-07-2026 11:00' },
  { Log_ID: '5', User_Name: 'Alice Johnson', Action: 'OUTWARD_ENTRY', Target: 'USB-C Hub 7-in-1 × 5', Date_Time: '03-07-2026 09:45' },
  { Log_ID: '6', User_Name: 'Bob Wilson', Action: 'INWARD_ENTRY', Target: 'Mechanical Keyboard × 15', Date_Time: '02-07-2026 16:20' },
  { Log_ID: '7', User_Name: 'Admin', Action: 'UPDATE_ROLE', Target: 'Inventory Lead permissions updated', Date_Time: '01-07-2026 17:00' },
  { Log_ID: '8', User_Name: 'Admin', Action: 'CREATE_USER', Target: 'Jane Smith (EMP005) created', Date_Time: '01-07-2026 09:30' },
  { Log_ID: '9', User_Name: 'System', Action: 'SAVE_SETTINGS', Target: 'Organisation details updated', Date_Time: '30-06-2026 18:00' },
  { Log_ID: '10', User_Name: 'Admin', Action: 'POST_NOTICE', Target: 'Quarterly Stock Audit notice posted', Date_Time: '24-05-2026 10:00' }
];

// 10. CUPBOARDS (INVENTORY MAP)
export const DEMO_CUPBOARDS: Cupboard[] = [
  { Cupboard_ID: 'CUP-1', Cupboard_Number: 'C-01', Name: 'Electronics Rack', Location: 'Sector A, Floor 1', Description: 'Storage for multimeters, test probes, and power units.', Image_URL: '', Color: '#1B3A6B', Status: 'Normal', _itemCount: 3, _totalQty: 24, _lowStock: 1 },
  { Cupboard_ID: 'CUP-2', Cupboard_Number: 'C-02', Name: 'PPE Storage Cabinet', Location: 'Sector B, Floor 1', Description: 'Gloves, safety glasses, vests, and helmets.', Image_URL: '', Color: '#16A34A', Status: 'Normal', _itemCount: 2, _totalQty: 65, _lowStock: 0 },
  { Cupboard_ID: 'CUP-3', Cupboard_Number: 'C-03', Name: 'Tools Drawer', Location: 'Sector A, Floor 1', Description: 'Hand tools, soldering iron, and screw drivers.', Image_URL: '', Color: '#E87722', Status: 'Normal', _itemCount: 2, _totalQty: 10, _lowStock: 1 },
  { Cupboard_ID: 'CUP-4', Cupboard_Number: 'C-04', Name: 'Cables Compartment', Location: 'Sector B, Floor 2', Description: 'LAN cables, HDMI, USB power cords.', Image_URL: '', Color: '#7C3AED', Status: 'Normal', _itemCount: 2, _totalQty: 120, _lowStock: 1 },
  { Cupboard_ID: 'CUP-5', Cupboard_Number: 'C-05', Name: 'Office Furniture Area', Location: 'Warehouse Sector C', Description: 'Heavy furniture, spare chairs, and meeting tables.', Image_URL: '', Color: '#6B7280', Status: 'Normal', _itemCount: 1, _totalQty: 8, _lowStock: 1 }
];

export const DEMO_CUPBOARD_ITEMS: CupItem[] = [
  { Item_ID: 'CI-1', Cupboard_ID: 'CUP-1', Item_Name: 'Digital Multimeter', Item_Code: 'MM-102', Category: 'Testing Equipment', Quantity: '12', Unit: 'pcs', Min_Qty: '5', Image_URL: '', Description: 'Handheld 6000 count digital multimeter' },
  { Item_ID: 'CI-2', Cupboard_ID: 'CUP-1', Item_Name: 'Oscilloscope Probe', Item_Code: 'OP-100', Category: 'Testing Equipment', Quantity: '10', Unit: 'pcs', Min_Qty: '12', Image_URL: '', Description: '100MHz passive oscilloscope probe (Low stock)' },
  { Item_ID: 'CI-3', Cupboard_ID: 'CUP-1', Item_Name: 'Benchtop Power Supply', Item_Code: 'PS-305', Category: 'Testing Equipment', Quantity: '2', Unit: 'pcs', Min_Qty: '1', Image_URL: '', Description: '0-30V 5A DC power supply' },
  
  { Item_ID: 'CI-4', Cupboard_ID: 'CUP-2', Item_Name: 'Safety Gloves (Heavy Duty)', Item_Code: 'SG-001', Category: 'PPE', Quantity: '45', Unit: 'pairs', Min_Qty: '20', Image_URL: '', Description: 'Reinforced industrial leather gloves' },
  { Item_ID: 'CI-5', Cupboard_ID: 'CUP-2', Item_Name: 'Safety Glasses Clear', Item_Code: 'SGC-02', Category: 'PPE', Quantity: '20', Unit: 'pcs', Min_Qty: '10', Image_URL: '', Description: 'Anti-scratch protective eyewear' },
  
  { Item_ID: 'CI-6', Cupboard_ID: 'CUP-3', Item_Name: 'Soldering Station', Item_Code: 'SS-200', Category: 'Tools', Quantity: '7', Unit: 'pcs', Min_Qty: '3', Image_URL: '', Description: 'Adjustable temperature soldering station' },
  { Item_ID: 'CI-7', Cupboard_ID: 'CUP-3', Item_Name: 'Screw Driver Set 12-in-1', Item_Code: 'SD-12', Category: 'Tools', Quantity: '3', Unit: 'sets', Min_Qty: '5', Image_URL: '', Description: 'Precision magnetic driver set (Low stock)' },
  
  { Item_ID: 'CI-8', Cupboard_ID: 'CUP-4', Item_Name: 'Ethernet Cable Cat6 5m', Item_Code: 'EC-005', Category: 'Cables', Quantity: '120', Unit: 'pcs', Min_Qty: '30', Image_URL: '', Description: 'Cat6 high-speed patch cords' },
  { Item_ID: 'CI-9', Cupboard_ID: 'CUP-4', Item_Name: 'HDMI Cable 2m', Item_Code: 'HC-002', Category: 'Cables', Quantity: '0', Unit: 'pcs', Min_Qty: '10', Image_URL: '', Description: 'Standard HDMI male to male cable (Out of stock)' },
  
  { Item_ID: 'CI-10', Cupboard_ID: 'CUP-5', Item_Name: 'Office Chair Ergonomic', Item_Code: 'OC-990', Category: 'Furniture', Quantity: '8', Unit: 'pcs', Min_Qty: '10', Image_URL: '', Description: 'Mesh high-back chairs (Low stock)' }
];

// 11. VENDORS
export const DEMO_VENDORS: Vendor[] = [
  { Vendor_ID: 'VND-1', Vendor_Name: 'ElectroCorp India Pvt Ltd', Contact_Person: 'Ramesh Shah', Phone: '9876543210', Email: 'sales@electrocorp.in', Address: 'Plot 12, GIDC, Anand', GSTIN: '24AAACE1234A1Z7', Category: 'Electronics', Status: 'Active', Notes: 'Preferred partner for electrical accessories' },
  { Vendor_ID: 'VND-2', Vendor_Name: 'TechParts India', Contact_Person: 'Sunita Patel', Phone: '9012345678', Email: 'info@techparts.co.in', Address: 'Sector 5, Gandhinagar', GSTIN: '24AAACT5678B1Z1', Category: 'Components', Status: 'Active', Notes: 'Good for urgent components and chips' },
  { Vendor_ID: 'VND-3', Vendor_Name: 'SafeWear Solutions', Contact_Person: 'Vijay Kumar', Phone: '8765432109', Email: 'orders@safewear.com', Address: 'Industrial Area, Surat', GSTIN: '24AAACS9012C1Z3', Category: 'PPE', Status: 'Active', Notes: 'Reliable supplier for helmets, gloves and safety shoes' },
  { Vendor_ID: 'VND-4', Vendor_Name: 'CableNet Supplies', Contact_Person: 'Rajesh Nair', Phone: '9823456789', Email: 'sales@cablenet.com', Address: 'GIDC Phase 2, Vadodara', GSTIN: '24AAACN3456D1Z2', Category: 'Cables', Status: 'Active', Notes: 'Direct mill pricing for LAN and electrical cabling' },
  { Vendor_ID: 'VND-5', Vendor_Name: 'OfficeSpaces Direct', Contact_Person: 'Meera Sen', Phone: '8109876543', Email: 'support@officespaces.in', Address: 'Kharadi IT park, Pune', GSTIN: '27AAACO4567E1Z4', Category: 'Furniture', Status: 'Active', Notes: 'Supply of ergonomic chairs and modular desks' }
];

// 12. ITEM MASTER
export const DEMO_ITEM_MASTER: ItemMaster[] = [
  { Item_ID: 'ITM-1', Item_Name: 'Digital Multimeter', Item_Code: 'MM-102', HSN_Code: '9030', Category: 'Testing Equipment', Unit: 'pcs', Min_Stock: '5', Max_Stock: '50', Reorder_Level: '10', Location: 'Cupboard A', Status: 'Active', Description: 'Handheld 6000 count digital multimeter' },
  { Item_ID: 'ITM-2', Item_Name: 'Safety Gloves (Heavy Duty)', Item_Code: 'SG-001', HSN_Code: '3926', Category: 'PPE', Unit: 'pairs', Min_Stock: '20', Max_Stock: '200', Reorder_Level: '40', Location: 'Cupboard B', Status: 'Active', Description: 'Reinforced industrial leather gloves' },
  { Item_ID: 'ITM-3', Item_Name: 'Soldering Station', Item_Code: 'SS-200', HSN_Code: '8515', Category: 'Tools', Unit: 'pcs', Min_Stock: '2', Max_Stock: '10', Reorder_Level: '3', Location: 'Cupboard A', Status: 'Active', Description: 'Adjustable temperature soldering station' },
  { Item_ID: 'ITM-4', Item_Name: 'Ethernet Cable Cat6 5m', Item_Code: 'EC-005', HSN_Code: '8544', Category: 'Electronics', Unit: 'pcs', Min_Stock: '30', Max_Stock: '500', Reorder_Level: '50', Location: 'Shelf A3', Status: 'Active', Description: 'Cat6 high-speed patch cords' },
  { Item_ID: 'ITM-5', Item_Name: 'Wireless Mouse', Item_Code: 'WM-002', HSN_Code: '8471', Category: 'Electronics', Unit: 'pcs', Min_Stock: '5', Max_Stock: '50', Reorder_Level: '10', Location: 'Shelf B2', Status: 'Active', Description: 'Optical wireless mouse black' },
  { Item_ID: 'ITM-6', Item_Name: 'Dell 24" Monitor', Item_Code: 'DM-024', HSN_Code: '8528', Category: 'Electronics', Unit: 'pcs', Min_Stock: '2', Max_Stock: '20', Reorder_Level: '5', Location: 'Row 1', Status: 'Active', Description: 'Full HD IPS panel display monitors' },
  { Item_ID: 'ITM-7', Item_Name: 'USB-C Hub 7-in-1', Item_Code: 'UH-007', HSN_Code: '8473', Category: 'Electronics', Unit: 'pcs', Min_Stock: '3', Max_Stock: '30', Reorder_Level: '6', Location: 'Shelf B4', Status: 'Active', Description: 'Aluminium housing USB hub' },
  { Item_ID: 'ITM-8', Item_Name: 'HDMI Cable 2m', Item_Code: 'HC-002', HSN_Code: '8544', Category: 'Electronics', Unit: 'pcs', Min_Stock: '10', Max_Stock: '100', Reorder_Level: '20', Location: 'Shelf A4', Status: 'Active', Description: 'High-speed gold plated HDMI lead' },
  { Item_ID: 'ITM-9', Item_Name: 'Office Chair Ergonomic', Item_Code: 'OC-990', HSN_Code: '9403', Category: 'Furniture', Unit: 'pcs', Min_Stock: '2', Max_Stock: '15', Reorder_Level: '4', Location: 'Warehouse Sec C', Status: 'Active', Description: 'Mesh high-back chairs' },
  { Item_ID: 'ITM-10', Item_Name: 'USB Flash Drive 64GB', Item_Code: 'FD-064', HSN_Code: '8523', Category: 'Electronics', Unit: 'pcs', Min_Stock: '15', Max_Stock: '150', Reorder_Level: '25', Location: 'Shelf B1', Status: 'Active', Description: 'USB 3.0 flash drive metal body' }
];

// 12b. BOXES / PLACEMENTS / INVOICES (backend-only — no fabricated demo rows)
export const DEMO_BOXES: Box[] = [];
export const DEMO_PLACEMENTS: Placement[] = [];
export const DEMO_INVOICES: Invoice[] = [];

// 13. GLOBAL SETTINGS MOCK
export const DEMO_SETTINGS = {
  orgName: 'Sicca Automation India Pvt Ltd',
  gstNo: '27AAACS1234A1Z5',
  address: 'Sector-A, Industrial Estate, Pune, MH',
  phone: '+91 20 2345 6789',
  email: 'info@sicca.com',
  lowStockEmail: 'true',
  weeklyDigest: 'false',
  outwardAlert: 'true'
};
