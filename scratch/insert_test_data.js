const APPS_URL = 'https://script.google.com/macros/s/AKfycbxePnfzSnkYCEWJMBm5pIQ3hbWK2OmTA7ojXLtVIIHtVnEhGGHgv0tNkflXM6r7LT5Q/exec';

const TEST_ITEMS = [
  {
    Item_ID: "TEST-ITEM-001",
    Item_Name: "TEST-USB-C Cable 1m",
    Item_Code: "TEST-001",
    HSN_Code: "8544",
    Category: "Cables",
    Unit: "Pcs",
    Min_Stock: 10,
    Max_Stock: 100,
    Reorder_Level: 20,
    Location: "Cupboard A",
    Image_URL: "",
    Description: "Premium braided USB-C charging cable",
    Status: "Active",
    Created_On: "2026-06-15",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-002",
    Item_Name: "TEST-Wireless Keyboard",
    Item_Code: "TEST-002",
    HSN_Code: "8471",
    Category: "Peripherals",
    Unit: "Pcs",
    Min_Stock: 5,
    Max_Stock: 50,
    Reorder_Level: 10,
    Location: "Cupboard B",
    Image_URL: "",
    Description: "Compact 75% wireless mechanical keyboard",
    Status: "Active",
    Created_On: "2026-06-15",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-003",
    Item_Name: "TEST-27\" Monitor",
    Item_Code: "TEST-003",
    HSN_Code: "8528",
    Category: "Monitors",
    Unit: "Pcs",
    Min_Stock: 3,
    Max_Stock: 20,
    Reorder_Level: 5,
    Location: "Cupboard C",
    Image_URL: "",
    Description: "4K IPS designer monitor with USB-C PD",
    Status: "Active",
    Created_On: "2026-06-15",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-004",
    Item_Name: "TEST-HDMI Adapter",
    Item_Code: "TEST-004",
    HSN_Code: "8544",
    Category: "Adapters",
    Unit: "Pcs",
    Min_Stock: 15,
    Max_Stock: 150,
    Reorder_Level: 30,
    Location: "Cupboard A",
    Image_URL: "",
    Description: "USB-C to HDMI 4K 60Hz adapter",
    Status: "Active",
    Created_On: "2026-06-15",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-005",
    Item_Name: "TEST-Laptop Stand",
    Item_Code: "TEST-005",
    HSN_Code: "7326",
    Category: "Accessories",
    Unit: "Pcs",
    Min_Stock: 5,
    Max_Stock: 30,
    Reorder_Level: 8,
    Location: "Cupboard B",
    Image_URL: "",
    Description: "Ergonomic aluminum laptop stand",
    Status: "Active",
    Created_On: "2026-06-15",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-006",
    Item_Name: "TEST-RJ45 Connector",
    Item_Code: "TEST-006",
    HSN_Code: "8536",
    Category: "Networking",
    Unit: "Pcs",
    Min_Stock: 100,
    Max_Stock: 1000,
    Reorder_Level: 200,
    Location: "Cupboard D",
    Image_URL: "",
    Description: "Cat6 pass-through RJ45 connectors",
    Status: "Active",
    Created_On: "2026-06-15",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-007",
    Item_Name: "TEST-Ethernet Cable 5m",
    Item_Code: "TEST-007",
    HSN_Code: "8544",
    Category: "Cables",
    Unit: "Pcs",
    Min_Stock: 10,
    Max_Stock: 100,
    Reorder_Level: 20,
    Location: "Cupboard D",
    Image_URL: "",
    Description: "Cat6 high-speed patch cable",
    Status: "Active",
    Created_On: "2026-06-15",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-008",
    Item_Name: "TEST-Power Strip 6-Way",
    Item_Code: "TEST-008",
    HSN_Code: "8536",
    Category: "Electrical",
    Unit: "Pcs",
    Min_Stock: 5,
    Max_Stock: 40,
    Reorder_Level: 10,
    Location: "Cupboard C",
    Image_URL: "",
    Description: "Surge-protected 6-outlet power strip",
    Status: "Active",
    Created_On: "2026-06-15",
    Last_Updated: "2026-07-11"
  }
];

const TEST_USERS = [
  {
    User_ID: "TEST-USR-101",
    Full_Name: "TEST-Alex Mercer",
    Email: "alex.mercer@test.com",
    Password_Hash: "argon2-dummy-hash",
    Employee_ID: "TEST-EMP-101",
    Department: "Warehouse Ops",
    Role: "Staff",
    Status: "Active",
    Display_Name: "Alex Mercer",
    Phone: "9876543210",
    Email_Alerts: "Yes",
    Force_Change: "No",
    Created_On: "2026-06-10",
    Last_Login: "2026-07-11",
    Verified: "Yes",
    Photo_URL: "",
    Permissions: "perm_view_inventory,perm_add_inward,perm_add_outward"
  }
];

const TEST_LEDGER = [
  // TEST-001 (USB-C Cable) - Inward 50, Outward 10. Balance: 40. (Min: 10, Reorder: 20 -> Normal)
  { Entry_ID: "TEST-ENT-001", Date_Time: "15-06-2026 10:00", Item_Name: "TEST-USB-C Cable 1m", Item_Code: "TEST-001", HSN_Code: "8544", Location: "Cupboard A", Transaction_Type: "Inward", Inward_Qty: "50", Invoice_No: "TEST-INV-001", Invoice_Date: "15-06-2026", GRN_No: "TEST-GRN-001", Vendor_Name: "ElectroCorp India", Price_Per_Item: "250", Discount_Pct: "0", Taxable_Value: "12500", GST_Rate: "18", CGST_Amt: "1125", SGST_Amt: "1125", Total_Invoice_Value: "14750", Outward_Qty: "", Balance_Qty: "50", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Initial batch" },
  { Entry_ID: "TEST-ENT-002", Date_Time: "20-06-2026 14:30", Item_Name: "TEST-USB-C Cable 1m", Item_Code: "TEST-001", HSN_Code: "8544", Location: "Cupboard A", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "10", Issued_To: "IT Support", Balance_Qty: "40", Employee_Name: "TEST-Alex Mercer", Received_By: "", Remarks: "Issued for new joiners" },

  // TEST-002 (Wireless Keyboard) - Inward 12, Outward 4. Balance: 8. (Min: 5, Reorder: 10 -> Low Stock!)
  { Entry_ID: "TEST-ENT-003", Date_Time: "18-06-2026 11:15", Item_Name: "TEST-Wireless Keyboard", Item_Code: "TEST-002", HSN_Code: "8471", Location: "Cupboard B", Transaction_Type: "Inward", Inward_Qty: "12", Invoice_No: "TEST-INV-002", Invoice_Date: "18-06-2026", GRN_No: "TEST-GRN-002", Vendor_Name: "TechParts India", Price_Per_Item: "1500", Discount_Pct: "0", Taxable_Value: "18000", GST_Rate: "18", CGST_Amt: "1620", SGST_Amt: "1620", Total_Invoice_Value: "21240", Outward_Qty: "", Balance_Qty: "12", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Replacement units" },
  { Entry_ID: "TEST-ENT-004", Date_Time: "25-06-2026 16:00", Item_Name: "TEST-Wireless Keyboard", Item_Code: "TEST-002", HSN_Code: "8471", Location: "Cupboard B", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "4", Issued_To: "Design Team", Balance_Qty: "8", Employee_Name: "TEST-Alex Mercer", Received_By: "", Remarks: "Issued for designers" },

  // TEST-003 (27" Monitor) - Inward 2, Outward 2. Balance: 0. (Min: 3, Reorder: 5 -> Out of Stock!)
  { Entry_ID: "TEST-ENT-005", Date_Time: "20-06-2026 09:30", Item_Name: "TEST-27\" Monitor", Item_Code: "TEST-003", HSN_Code: "8528", Location: "Cupboard C", Transaction_Type: "Inward", Inward_Qty: "2", Invoice_No: "TEST-INV-003", Invoice_Date: "19-06-2026", GRN_No: "TEST-GRN-003", Vendor_Name: "ScreenPro Ltd", Price_Per_Item: "22000", Discount_Pct: "0", Taxable_Value: "44000", GST_Rate: "18", CGST_Amt: "3960", SGST_Amt: "3960", Total_Invoice_Value: "51920", Outward_Qty: "", Balance_Qty: "2", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "High-res designer screens" },
  { Entry_ID: "TEST-ENT-006", Date_Time: "28-06-2026 15:45", Item_Name: "TEST-27\" Monitor", Item_Code: "TEST-003", HSN_Code: "8528", Location: "Cupboard C", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "2", Issued_To: "Marketing Dept", Balance_Qty: "0", Employee_Name: "TEST-Alex Mercer", Received_By: "", Remarks: "Setup for video editors" },

  // TEST-004 (HDMI Adapter) - Inward 100, Outward 20. Balance: 80. (Min: 15, Reorder: 30 -> Normal)
  { Entry_ID: "TEST-ENT-007", Date_Time: "22-06-2026 14:00", Item_Name: "TEST-HDMI Adapter", Item_Code: "TEST-004", HSN_Code: "8544", Location: "Cupboard A", Transaction_Type: "Inward", Inward_Qty: "100", Invoice_No: "TEST-INV-004", Invoice_Date: "21-06-2026", GRN_No: "TEST-GRN-004", Vendor_Name: "ElectroCorp India", Price_Per_Item: "400", Discount_Pct: "0", Taxable_Value: "40000", GST_Rate: "18", CGST_Amt: "3600", SGST_Amt: "3600", Total_Invoice_Value: "47200", Outward_Qty: "", Balance_Qty: "100", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Bulk supply" },
  { Entry_ID: "TEST-ENT-008", Date_Time: "02-07-2026 10:30", Item_Name: "TEST-HDMI Adapter", Item_Code: "TEST-004", HSN_Code: "8544", Location: "Cupboard A", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "20", Issued_To: "Conference Room A", Balance_Qty: "80", Employee_Name: "TEST-Alex Mercer", Received_By: "", Remarks: "Setup for meeting rooms" },

  // TEST-005 (Laptop Stand) - Inward 6. Balance: 6. (Min: 5, Reorder: 8 -> Low Stock!)
  { Entry_ID: "TEST-ENT-009", Date_Time: "24-06-2026 12:00", Item_Name: "TEST-Laptop Stand", Item_Code: "TEST-005", HSN_Code: "7326", Location: "Cupboard B", Transaction_Type: "Inward", Inward_Qty: "6", Invoice_No: "TEST-INV-005", Invoice_Date: "24-06-2026", GRN_No: "TEST-GRN-005", Vendor_Name: "TechParts India", Price_Per_Item: "1200", Discount_Pct: "0", Taxable_Value: "7200", GST_Rate: "18", CGST_Amt: "648", SGST_Amt: "648", Total_Invoice_Value: "8496", Outward_Qty: "", Balance_Qty: "6", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Sample accessories" },

  // TEST-006 (RJ45 Connector) - Inward 500, Outward 100. Balance: 400. (Min: 100, Reorder: 200 -> Normal)
  { Entry_ID: "TEST-ENT-010", Date_Time: "26-06-2026 15:00", Item_Name: "TEST-RJ45 Connector", Item_Code: "TEST-006", HSN_Code: "8536", Location: "Cupboard D", Transaction_Type: "Inward", Inward_Qty: "500", Invoice_No: "TEST-INV-006", Invoice_Date: "25-06-2026", GRN_No: "TEST-GRN-006", Vendor_Name: "ElectroCorp India", Price_Per_Item: "5", Discount_Pct: "0", Taxable_Value: "2500", GST_Rate: "18", CGST_Amt: "225", SGST_Amt: "225", Total_Invoice_Value: "2950", Outward_Qty: "", Balance_Qty: "500", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Network components" },
  { Entry_ID: "TEST-ENT-011", Date_Time: "04-07-2026 09:30", Item_Name: "TEST-RJ45 Connector", Item_Code: "TEST-006", HSN_Code: "8536", Location: "Cupboard D", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "100", Issued_To: "Networking Dept", Balance_Qty: "400", Employee_Name: "TEST-Alex Mercer", Received_By: "", Remarks: "Server room wiring" },

  // TEST-007 (Ethernet Cable 5m) - Inward 30. Balance: 30. (Min: 10, Reorder: 20 -> Normal)
  { Entry_ID: "TEST-ENT-012", Date_Time: "28-06-2026 10:00", Item_Name: "TEST-Ethernet Cable 5m", Item_Code: "TEST-007", HSN_Code: "8544", Location: "Cupboard D", Transaction_Type: "Inward", Inward_Qty: "30", Invoice_No: "TEST-INV-007", Invoice_Date: "27-06-2026", GRN_No: "TEST-GRN-007", Vendor_Name: "ElectroCorp India", Price_Per_Item: "350", Discount_Pct: "0", Taxable_Value: "10500", GST_Rate: "18", CGST_Amt: "945", SGST_Amt: "945", Total_Invoice_Value: "12390", Outward_Qty: "", Balance_Qty: "30", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Cabling project" },

  // TEST-008 (Power Strip 6-Way) - Inward 15, Outward 14. Balance: 1. (Min: 5, Reorder: 10 -> Low Stock!)
  { Entry_ID: "TEST-ENT-013", Date_Time: "30-06-2026 11:00", Item_Name: "TEST-Power Strip 6-Way", Item_Code: "TEST-008", HSN_Code: "8536", Location: "Cupboard C", Transaction_Type: "Inward", Inward_Qty: "15", Invoice_No: "TEST-INV-008", Invoice_Date: "29-06-2026", GRN_No: "TEST-GRN-008", Vendor_Name: "ElectroCorp India", Price_Per_Item: "800", Discount_Pct: "0", Taxable_Value: "12000", GST_Rate: "18", CGST_Amt: "1080", SGST_Amt: "1080", Total_Invoice_Value: "14160", Outward_Qty: "", Balance_Qty: "15", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Power strips" },
  { Entry_ID: "TEST-ENT-014", Date_Time: "08-07-2026 14:00", Item_Name: "TEST-Power Strip 6-Way", Item_Code: "TEST-008", HSN_Code: "8536", Location: "Cupboard C", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "14", Issued_To: "Lab Setup", Balance_Qty: "1", Employee_Name: "TEST-Alex Mercer", Received_By: "", Remarks: "Electronics lab" }
];

async function postRow(tab, data) {
  const res = await fetch(APPS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      sheet: 'database',
      tab: tab,
      data: data
    })
  });
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  const json = await res.json();
  if (!json || json.success === false) {
    throw new Error(json?.error || 'Failed to post row data');
  }
  return json;
}

async function run() {
  try {
    console.log('Inserting TEST users...');
    for (const u of TEST_USERS) {
      await postRow('Users', u);
      console.log(`- Inserted User: ${u.Full_Name}`);
    }

    console.log('Inserting TEST items...');
    for (const item of TEST_ITEMS) {
      await postRow('Item_Master', item);
      console.log(`- Inserted Item: ${item.Item_Name}`);
    }

    console.log('Inserting TEST stock ledger entries...');
    for (const entry of TEST_LEDGER) {
      await postRow('Stock_Register', entry);
      console.log(`- Inserted Ledger Entry: ${entry.Entry_ID} (${entry.Item_Name})`);
    }

    console.log('ALL TEST DATA INSERTED SUCCESSFULLY!');
  } catch (err) {
    console.error('Execution failed:', err);
  }
}

run();
