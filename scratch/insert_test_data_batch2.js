const APPS_URL = 'https://script.google.com/macros/s/AKfycbxePnfzSnkYCEWJMBm5pIQ3hbWK2OmTA7ojXLtVIIHtVnEhGGHgv0tNkflXM6r7LT5Q/exec';

const TEST_ITEMS_BATCH2 = [
  {
    Item_ID: "TEST-ITEM-009",
    Item_Name: "TEST-USB-C Hub 6-in-1",
    Item_Code: "TEST-009",
    HSN_Code: "8471",
    Category: "Adapters",
    Unit: "Pcs",
    Min_Stock: 5,
    Max_Stock: 50,
    Reorder_Level: 10,
    Location: "Box A",
    Image_URL: "",
    Description: "USB-C Multiport Adapter with HDMI & USB 3.0",
    Status: "Active",
    Created_On: "2026-07-11",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-010",
    Item_Name: "TEST-Wireless Mouse",
    Item_Code: "TEST-010",
    HSN_Code: "8471",
    Category: "Peripherals",
    Unit: "Pcs",
    Min_Stock: 10,
    Max_Stock: 80,
    Reorder_Level: 20,
    Location: "Box B",
    Image_URL: "",
    Description: "Ergonomic 2.4GHz wireless mouse",
    Status: "Active",
    Created_On: "2026-07-11",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-011",
    Item_Name: "TEST-Ethernet Switch 8-Port",
    Item_Code: "TEST-011",
    HSN_Code: "8517",
    Category: "Networking",
    Unit: "Pcs",
    Min_Stock: 2,
    Max_Stock: 15,
    Reorder_Level: 4,
    Location: "Store Room - Ground Floor",
    Image_URL: "",
    Description: "Gigabit unmanaged desktop switch",
    Status: "Active",
    Created_On: "2026-07-11",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-012",
    Item_Name: "TEST-LED Desk Lamp",
    Item_Code: "TEST-012",
    HSN_Code: "9405",
    Category: "Electrical",
    Unit: "Pcs",
    Min_Stock: 3,
    Max_Stock: 25,
    Reorder_Level: 6,
    Location: "Cupboard 1",
    Image_URL: "",
    Description: "Dimmable LED office desk lamp",
    Status: "Active",
    Created_On: "2026-07-11",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-013",
    Item_Name: "TEST-HDMI Cable 2m",
    Item_Code: "TEST-013",
    HSN_Code: "8544",
    Category: "Cables",
    Unit: "Pcs",
    Min_Stock: 15,
    Max_Stock: 120,
    Reorder_Level: 25,
    Location: "Box C",
    Image_URL: "",
    Description: "High-speed HDMI 2.0 cable",
    Status: "Active",
    Created_On: "2026-07-11",
    Last_Updated: "2026-07-11"
  },
  {
    Item_ID: "TEST-ITEM-014",
    Item_Name: "TEST-Screwdriver Set",
    Item_Code: "TEST-014",
    HSN_Code: "8205",
    Category: "Accessories",
    Unit: "Pcs",
    Min_Stock: 5,
    Max_Stock: 30,
    Reorder_Level: 8,
    Location: "Cupboard 2",
    Image_URL: "",
    Description: "Multi-bit precision screwdriver set",
    Status: "Active",
    Created_On: "2026-07-11",
    Last_Updated: "2026-07-11"
  }
];

const TEST_LEDGER_BATCH2 = [
  // TEST-009 (USB-C Hub) - Inward 20, Outward 5. Balance: 15. (Min: 5, Reorder: 10 -> Normal)
  { Entry_ID: "TEST-ENT-015", Date_Time: "01-07-2026 11:30", Item_Name: "TEST-USB-C Hub 6-in-1", Item_Code: "TEST-009", HSN_Code: "8471", Location: "Box A", Transaction_Type: "Inward", Inward_Qty: "20", Invoice_No: "TEST-INV-009", Invoice_Date: "01-07-2026", GRN_No: "TEST-GRN-009", Vendor_Name: "TechGiant India", Price_Per_Item: "1200", Discount_Pct: "0", Taxable_Value: "24000", GST_Rate: "18", CGST_Amt: "2160", SGST_Amt: "2160", Total_Invoice_Value: "28320", Outward_Qty: "", Balance_Qty: "20", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "C-type adapters" },
  { Entry_ID: "TEST-ENT-016", Date_Time: "05-07-2026 15:00", Item_Name: "TEST-USB-C Hub 6-in-1", Item_Code: "TEST-009", HSN_Code: "8471", Location: "Box A", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "5", Issued_To: "QA Lab", Balance_Qty: "15", Employee_Name: "TEST-Alex Mercer", Received_By: "", Remarks: "Setup for QA machines" },

  // TEST-010 (Wireless Mouse) - Inward 30, Outward 10. Balance: 20. (Min: 10, Reorder: 20 -> Low Stock!)
  { Entry_ID: "TEST-ENT-017", Date_Time: "02-07-2026 10:00", Item_Name: "TEST-Wireless Mouse", Item_Code: "TEST-010", HSN_Code: "8471", Location: "Box B", Transaction_Type: "Inward", Inward_Qty: "30", Invoice_No: "TEST-INV-010", Invoice_Date: "02-07-2026", GRN_No: "TEST-GRN-010", Vendor_Name: "Logitech Distributor", Price_Per_Item: "650", Discount_Pct: "0", Taxable_Value: "19500", GST_Rate: "18", CGST_Amt: "1755", SGST_Amt: "1755", Total_Invoice_Value: "23010", Outward_Qty: "", Balance_Qty: "30", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Peripherals supply" },
  { Entry_ID: "TEST-ENT-018", Date_Time: "07-07-2026 16:30", Item_Name: "TEST-Wireless Mouse", Item_Code: "TEST-010", HSN_Code: "8471", Location: "Box B", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "10", Issued_To: "Dev Team", Balance_Qty: "20", Employee_Name: "TEST-Alex Mercer", Received_By: "", Remarks: "New joiner kit" },

  // TEST-011 (Ethernet Switch 8-Port) - Inward 10. Balance: 10. (Min: 2, Reorder: 4 -> Normal)
  { Entry_ID: "TEST-ENT-019", Date_Time: "03-07-2026 14:00", Item_Name: "TEST-Ethernet Switch 8-Port", Item_Code: "TEST-011", HSN_Code: "8517", Location: "Store Room - Ground Floor", Transaction_Type: "Inward", Inward_Qty: "10", Invoice_No: "TEST-INV-011", Invoice_Date: "03-07-2026", GRN_No: "TEST-GRN-011", Vendor_Name: "Alpha Network Solutions", Price_Per_Item: "2400", Discount_Pct: "0", Taxable_Value: "24000", GST_Rate: "18", CGST_Amt: "2160", SGST_Amt: "2160", Total_Invoice_Value: "28320", Outward_Qty: "", Balance_Qty: "10", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Infrastructure hardware" },

  // TEST-012 (LED Desk Lamp) - Inward 15, Outward 15. Balance: 0. (Min: 3, Reorder: 6 -> Out of Stock!)
  { Entry_ID: "TEST-ENT-020", Date_Time: "04-07-2026 11:00", Item_Name: "TEST-LED Desk Lamp", Item_Code: "TEST-012", HSN_Code: "9405", Location: "Cupboard 1", Transaction_Type: "Inward", Inward_Qty: "15", Invoice_No: "TEST-INV-012", Invoice_Date: "04-07-2026", GRN_No: "TEST-GRN-012", Vendor_Name: "PowerGrid Electricals", Price_Per_Item: "950", Discount_Pct: "0", Taxable_Value: "14250", GST_Rate: "18", CGST_Amt: "1282.5", SGST_Amt: "1282.5", Total_Invoice_Value: "16815", Outward_Qty: "", Balance_Qty: "15", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Office accessories" },
  { Entry_ID: "TEST-ENT-021", Date_Time: "09-07-2026 13:00", Item_Name: "TEST-LED Desk Lamp", Item_Code: "TEST-012", HSN_Code: "9405", Location: "Cupboard 1", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "15", Issued_To: "HR Dept", Balance_Qty: "0", Employee_Name: "TEST-Alex Mercer", Received_By: "", Remarks: "Cabin allocations" },

  // TEST-013 (HDMI Cable 2m) - Inward 50. Balance: 50. (Min: 15, Reorder: 25 -> Normal)
  { Entry_ID: "TEST-ENT-022", Date_Time: "05-07-2026 10:00", Item_Name: "TEST-HDMI Cable 2m", Item_Code: "TEST-013", HSN_Code: "8544", Location: "Box C", Transaction_Type: "Inward", Inward_Qty: "50", Invoice_No: "TEST-INV-013", Invoice_Date: "04-07-2026", GRN_No: "TEST-GRN-013", Vendor_Name: "Apex Industrial Supplies", Price_Per_Item: "350", Discount_Pct: "0", Taxable_Value: "17500", GST_Rate: "18", CGST_Amt: "1575", SGST_Amt: "1575", Total_Invoice_Value: "20650", Outward_Qty: "", Balance_Qty: "50", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Cabling supplies" },

  // TEST-014 (Screwdriver Set) - Inward 8, Outward 6. Balance: 2. (Min: 5, Reorder: 8 -> Low Stock!)
  { Entry_ID: "TEST-ENT-023", Date_Time: "06-07-2026 12:00", Item_Name: "TEST-Screwdriver Set", Item_Code: "TEST-014", HSN_Code: "8205", Location: "Cupboard 2", Transaction_Type: "Inward", Inward_Qty: "8", Invoice_No: "TEST-INV-014", Invoice_Date: "05-07-2026", GRN_No: "TEST-GRN-014", Vendor_Name: "Apex Industrial Supplies", Price_Per_Item: "850", Discount_Pct: "0", Taxable_Value: "6800", GST_Rate: "18", CGST_Amt: "612", SGST_Amt: "612", Total_Invoice_Value: "8024", Outward_Qty: "", Balance_Qty: "8", Employee_Name: "TEST-Alex Mercer", Received_By: "TEST-Alex Mercer", Remarks: "Tools purchase" },
  { Entry_ID: "TEST-ENT-024", Date_Time: "10-07-2026 14:30", Item_Name: "TEST-Screwdriver Set", Item_Code: "TEST-014", HSN_Code: "8205", Location: "Cupboard 2", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "6", Issued_To: "Maintenance", Balance_Qty: "2", Employee_Name: "TEST-Alex Mercer", Received_By: "", Remarks: "Issued to ground floor team" }
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
    console.log('Inserting TEST items (Batch 2)...');
    for (const item of TEST_ITEMS_BATCH2) {
      await postRow('Item_Master', item);
      console.log(`- Inserted Item: ${item.Item_Name} at ${item.Location}`);
    }

    console.log('Inserting TEST stock ledger entries (Batch 2)...');
    for (const entry of TEST_LEDGER_BATCH2) {
      await postRow('Stock_Register', entry);
      console.log(`- Inserted Ledger Entry: ${entry.Entry_ID} (${entry.Item_Name}) with Vendor: ${entry.Vendor_Name || 'N/A'}`);
    }

    console.log('BATCH 2 TEST DATA INSERTED SUCCESSFULLY!');
  } catch (err) {
    console.error('Execution failed:', err);
  }
}

run();
