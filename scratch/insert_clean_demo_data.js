const APPS_URL = 'https://script.google.com/macros/s/AKfycbxePnfzSnkYCEWJMBm5pIQ3hbWK2OmTA7ojXLtVIIHtVnEhGGHgv0tNkflXM6r7LT5Q/exec';

const VENDORS = [
  { Vendor_ID: "VND-001", Vendor_Name: "ElectroCorp India", Contact_Person: "Amit Sharma", Phone: "9876543210", Email: "sales@electrocorp.in", Address: "12, Industrial Area, Phase-I, Bangalore", GSTIN: "29AAAAA0000A1Z1", Category: "Electrical", Status: "Active", Created_On: "2026-06-01", Notes: "Preferred vendor for test equipment" },
  { Vendor_ID: "VND-002", Vendor_Name: "TechParts Solutions", Contact_Person: "Nehal Gupta", Phone: "9812345678", Email: "orders@techparts.co.in", Address: "Sector 4, Noida, UP", GSTIN: "29BBBBB0000B1Z2", Category: "Electronics", Status: "Active", Created_On: "2026-06-01", Notes: "Reliable electronic components supplier" },
  { Vendor_ID: "VND-003", Vendor_Name: "SafetyPro Supplies", Contact_Person: "Rajesh Varma", Phone: "9711223344", Email: "support@safetypro.in", Address: "MIDC, Andheri East, Mumbai", GSTIN: "29CCCCC0000C1Z3", Category: "PPE", Status: "Active", Created_On: "2026-06-01", Notes: "GST-registered safety wear supplier" },
  { Vendor_ID: "VND-004", Vendor_Name: "Alpha Network Systems", Contact_Person: "Sanjay Sen", Phone: "9900112233", Email: "b2b@alphanetworks.com", Address: "Salt Lake, Sector V, Kolkata", GSTIN: "29DDDDD0000D1Z4", Category: "Networking", Status: "Active", Created_On: "2026-06-01", Notes: "OEM distributor for network cabling" },
  { Vendor_ID: "VND-005", Vendor_Name: "OfficeGear Ltd", Contact_Person: "Meera Nair", Phone: "9845012345", Email: "corporate@officegear.in", Address: "Kochi, Kerala", GSTIN: "29EEEEE0000E1Z5", Category: "Office Accessories", Status: "Active", Created_On: "2026-06-01", Notes: "Stationery and printing equipment" },
  { Vendor_ID: "VND-006", Vendor_Name: "Apex Industrial Tools", Contact_Person: "Vikram Malhotra", Phone: "9945087654", Email: "vikram@apextools.com", Address: "Peenya Industrial Area, Bangalore", GSTIN: "29FFFFF0000F1Z6", Category: "Tools", Status: "Active", Created_On: "2026-06-01", Notes: "Industrial tools and accessories vendor" }
];

const USERS = [
  { User_ID: "USR-002", Full_Name: "Rajesh Kumar", Email: "rajesh.kumar@wfmail.in", Password_Hash: "argon2-dummy-hash", Employee_ID: "EMP-102", Department: "Warehouse Operations", Role: "Staff", Status: "Active", Display_Name: "Rajesh Kumar", Phone: "9876500102", Email_Alerts: "YES", Force_Change: "NO", Created_On: "2026-06-10", Last_Login: "2026-07-11", Verified: "YES", Photo_URL: "", Permissions: "perm_view_inventory,perm_add_inward,perm_add_outward" },
  { User_ID: "USR-003", Full_Name: "Priya Sharma", Email: "priya.sharma@wfmail.in", Password_Hash: "argon2-dummy-hash", Employee_ID: "EMP-103", Department: "IT Support", Role: "Staff", Status: "Active", Display_Name: "Priya Sharma", Phone: "9876500103", Email_Alerts: "YES", Force_Change: "NO", Created_On: "2026-06-10", Last_Login: "2026-07-11", Verified: "YES", Photo_URL: "", Permissions: "perm_view_inventory,perm_view_price" }
];

const ITEMS = [
  { Item_ID: "ITEM-001", Item_Name: "Digital Multimeter Fluke 115", Item_Code: "FLK-115", HSN_Code: "8544", Category: "Testing Equipment", Unit: "pcs", Min_Stock: "5", Max_Stock: "50", Reorder_Level: "10", Location: "Cupboard A", Image_URL: "", Description: "Fluke 115 True-RMS Digital Multimeter", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-002", Item_Name: "Safety Gloves Nitrile", Item_Code: "GLV-01", HSN_Code: "4015", Category: "PPE", Unit: "pairs", Min_Stock: "50", Max_Stock: "500", Reorder_Level: "100", Location: "Cupboard B", Image_URL: "", Description: "Heavy-duty nitrile chemical gloves", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-003", Item_Name: "Soldering Station Hakko FX-888D", Item_Code: "HK-888D", HSN_Code: "8515", Category: "Testing Equipment", Unit: "pcs", Min_Stock: "3", Max_Stock: "20", Reorder_Level: "5", Location: "Cupboard A", Image_URL: "", Description: "Hakko FX-888D digital soldering station", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-004", Item_Name: "Safety Helmet White", Item_Code: "HLM-03", HSN_Code: "6506", Category: "PPE", Unit: "pcs", Min_Stock: "10", Max_Stock: "100", Reorder_Level: "20", Location: "Cupboard B", Image_URL: "", Description: "Industrial safety helmet type-1", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-005", Item_Name: "Screwdriver Set Wiha", Item_Code: "SD-WIHA", HSN_Code: "8205", Category: "Tools", Unit: "sets", Min_Stock: "5", Max_Stock: "30", Reorder_Level: "8", Location: "Cupboard C", Image_URL: "", Description: "Wiha insulated screwdriver set 12-pcs", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-006", Item_Name: "Crimping Tool RJ45", Item_Code: "CR-RJ45", HSN_Code: "8203", Category: "Tools", Unit: "pcs", Min_Stock: "4", Max_Stock: "25", Reorder_Level: "6", Location: "Cupboard C", Image_URL: "", Description: "Professional pass-through RJ45 crimper", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-007", Item_Name: "Cat6 Ethernet Cable 305m", Item_Code: "C6-305M", HSN_Code: "8544", Category: "Consumables", Unit: "rolls", Min_Stock: "5", Max_Stock: "40", Reorder_Level: "10", Location: "Store Room A", Image_URL: "", Description: "Cat6 solid copper UTP cable box", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-008", Item_Name: "USB-C Hub 6-in-1 Anker", Item_Code: "HUB-ANK", HSN_Code: "8471", Category: "Electronics", Unit: "pcs", Min_Stock: "8", Max_Stock: "60", Reorder_Level: "15", Location: "Cupboard D", Image_URL: "", Description: "Anker USB-C hub with Power Delivery", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-009", Item_Name: "Wireless Presenter Pointer", Item_Code: "PRES-PNT", HSN_Code: "8471", Category: "Electronics", Unit: "pcs", Min_Stock: "3", Max_Stock: "20", Reorder_Level: "5", Location: "Cupboard D", Image_URL: "", Description: "Logitech wireless laser presentation clicker", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-010", Item_Name: "HDMI Cable High Speed 3m", Item_Code: "HDMI-3M", HSN_Code: "8544", Category: "Consumables", Unit: "pcs", Min_Stock: "15", Max_Stock: "150", Reorder_Level: "30", Location: "Store Room A", Image_URL: "", Description: "Gold-plated HDMI 2.0 4K cables", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-011", Item_Name: "Label Printer Brother PT-D210", Item_Code: "PRN-BRO", HSN_Code: "8443", Category: "Office Accessories", Unit: "pcs", Min_Stock: "2", Max_Stock: "10", Reorder_Level: "4", Location: "Cupboard E", Image_URL: "", Description: "Brother P-Touch desktop label maker", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-012", Item_Name: "Self-Adhesive Labels Tape", Item_Code: "LBL-TPE", HSN_Code: "3919", Category: "Consumables", Unit: "rolls", Min_Stock: "10", Max_Stock: "100", Reorder_Level: "20", Location: "Cupboard E", Image_URL: "", Description: "TZe-231 12mm black-on-white tape", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-013", Item_Name: "Allen Key Set Bondhus", Item_Code: "AK-BOND", HSN_Code: "8204", Category: "Tools", Unit: "sets", Min_Stock: "5", Max_Stock: "40", Reorder_Level: "10", Location: "Cupboard C", Image_URL: "", Description: "Bondhus imperial hex keys L-wrench set", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-014", Item_Name: "Safety Goggles Clear", Item_Code: "GOG-01", HSN_Code: "9004", Category: "PPE", Unit: "pcs", Min_Stock: "20", Max_Stock: "200", Reorder_Level: "40", Location: "Cupboard B", Image_URL: "", Description: "Anti-fog protective eyewear safety glasses", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-015", Item_Name: "Rechargeable AA Batteries 4-Pack", Item_Code: "BAT-AA", HSN_Code: "8506", Category: "Consumables", Unit: "packs", Min_Stock: "12", Max_Stock: "100", Reorder_Level: "24", Location: "Store Room B", Image_URL: "", Description: "Eneloop Pro high-capacity batteries", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" },
  { Item_ID: "ITEM-016", Item_Name: "Adjustable Spanner Stanley", Item_Code: "SPN-STAN", HSN_Code: "8204", Category: "Tools", Unit: "pcs", Min_Stock: "5", Max_Stock: "30", Reorder_Level: "10", Location: "Cupboard C", Image_URL: "", Description: "Stanley 10-inch adjustable wrench", Status: "Active", Created_On: "2026-06-15", Last_Updated: "2026-07-11" }
];

const CUPBOARDS = [
  { Cupboard_ID: "CPB-001", Cupboard_Number: "A", Name: "Cupboard A", Location: "Testing Lab", Description: "Electronic testing equipment storage cupboard", Image_URL: "", Color: "blue", Status: "Active", Created_On: "2026-06-01", Type: "Metal Cabinets" },
  { Cupboard_ID: "CPB-002", Cupboard_Number: "B", Name: "Cupboard B", Location: "Safety Room", Description: "Personal protective equipment (PPE) cabinet", Image_URL: "", Color: "red", Status: "Active", Created_On: "2026-06-01", Type: "Metal Cabinets" },
  { Cupboard_ID: "CPB-003", Cupboard_Number: "C", Name: "Cupboard C", Location: "Tools Workshop", Description: "Hand tools and mechanical accessories storage", Image_URL: "", Color: "green", Status: "Active", Created_On: "2026-06-01", Type: "Wooden Cupboards" },
  { Cupboard_ID: "CPB-004", Cupboard_Number: "D", Name: "Cupboard D", Location: "IT Support Office", Description: "Computer peripherals and display spares cabinet", Image_URL: "", Color: "yellow", Status: "Active", Created_On: "2026-06-01", Type: "Glass Display Cabinets" },
  { Cupboard_ID: "CPB-005", Cupboard_Number: "E", Name: "Cupboard E", Location: "Admin Office", Description: "Label printers and office supplies storage cupboard", Image_URL: "", Color: "gray", Status: "Active", Created_On: "2026-06-01", Type: "Wooden Cupboards" },
  { Cupboard_ID: "CPB-006", Cupboard_Number: "SR-A", Name: "Store Room A", Location: "Store Room - Ground Floor", Description: "Consumables and bulk packaging shelves", Image_URL: "", Color: "orange", Status: "Active", Created_On: "2026-06-01", Type: "Open Racks" },
  { Cupboard_ID: "CPB-007", Cupboard_Number: "SR-B", Name: "Store Room B", Location: "Store Room - First Floor", Description: "Battery packs and auxiliary storage racks", Image_URL: "", Color: "indigo", Status: "Active", Created_On: "2026-06-01", Type: "Open Racks" },
  { Cupboard_ID: "CPB-008", Cupboard_Number: "SR-C", Name: "Store Room C", Location: "Store Room - Ground Floor", Description: "Heavy-duty mechanical assembly cabinets", Image_URL: "", Color: "purple", Status: "Active", Created_On: "2026-06-01", Type: "Heavy Duty Shelves" }
];

const BOXES = [
  { Box_ID: "BOX-001", Cupboard_ID: "CPB-001", Box_Name: "A-1", Description: "Multimeters", Created_On: "2026-06-05" },
  { Box_ID: "BOX-002", Cupboard_ID: "CPB-001", Box_Name: "A-2", Description: "Soldering station accessories", Created_On: "2026-06-05" },
  { Box_ID: "BOX-003", Cupboard_ID: "CPB-002", Box_Name: "B-1", Description: "Gloves", Created_On: "2026-06-05" },
  { Box_ID: "BOX-004", Cupboard_ID: "CPB-002", Box_Name: "B-2", Description: "Helmets", Created_On: "2026-06-05" },
  { Box_ID: "BOX-005", Cupboard_ID: "CPB-002", Box_Name: "B-3", Description: "Goggles", Created_On: "2026-06-05" },
  { Box_ID: "BOX-006", Cupboard_ID: "CPB-003", Box_Name: "C-1", Description: "Screwdrivers", Created_On: "2026-06-05" },
  { Box_ID: "BOX-007", Cupboard_ID: "CPB-003", Box_Name: "C-2", Description: "Crimpers", Created_On: "2026-06-05" },
  { Box_ID: "BOX-008", Cupboard_ID: "CPB-003", Box_Name: "C-3", Description: "Allen Keys", Created_On: "2026-06-05" },
  { Box_ID: "BOX-009", Cupboard_ID: "CPB-003", Box_Name: "C-4", Description: "Spanners", Created_On: "2026-06-05" },
  { Box_ID: "BOX-010", Cupboard_ID: "CPB-004", Box_Name: "D-1", Description: "USB Hubs", Created_On: "2026-06-05" },
  { Box_ID: "BOX-011", Cupboard_ID: "CPB-004", Box_Name: "D-2", Description: "Presenters", Created_On: "2026-06-05" },
  { Box_ID: "BOX-012", Cupboard_ID: "CPB-005", Box_Name: "E-1", Description: "Printers", Created_On: "2026-06-05" },
  { Box_ID: "BOX-013", Cupboard_ID: "CPB-005", Box_Name: "E-2", Description: "Label Tapes", Created_On: "2026-06-05" },
  { Box_ID: "BOX-014", Cupboard_ID: "CPB-006", Box_Name: "SR-A1", Description: "Ethernet Cables", Created_On: "2026-06-05" },
  { Box_ID: "BOX-015", Cupboard_ID: "CPB-006", Box_Name: "SR-A2", Description: "HDMI Cables", Created_On: "2026-06-05" },
  { Box_ID: "BOX-016", Cupboard_ID: "CPB-007", Box_Name: "SR-B1", Description: "Batteries", Created_On: "2026-06-05" },
  { Box_ID: "BOX-017", Cupboard_ID: "CPB-007", Box_Name: "SR-B2", Description: "Consumables Misc", Created_On: "2026-06-05" },
  { Box_ID: "BOX-018", Cupboard_ID: "CPB-008", Box_Name: "SR-C1", Description: "Heavy Equipment", Created_On: "2026-06-05" },
  { Box_ID: "BOX-019", Cupboard_ID: "CPB-008", Box_Name: "SR-C2", Description: "Hardware components", Created_On: "2026-06-05" }
];

const PLACEMENTS = [
  { Placement_ID: "PL-001", Item_Code: "FLK-115", Cupboard_ID: "CPB-001", Box_ID: "BOX-001", Quantity: "40", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-002", Item_Code: "GLV-01", Cupboard_ID: "CPB-002", Box_ID: "BOX-003", Quantity: "80", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-003", Item_Code: "HK-888D", Cupboard_ID: "CPB-001", Box_ID: "BOX-002", Quantity: "0", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-004", Item_Code: "HLM-03", Cupboard_ID: "CPB-002", Box_ID: "BOX-004", Quantity: "50", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-005", Item_Code: "SD-WIHA", Cupboard_ID: "CPB-003", Box_ID: "BOX-006", Quantity: "6", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-006", Item_Code: "CR-RJ45", Cupboard_ID: "CPB-003", Box_ID: "BOX-007", Quantity: "15", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-007", Item_Code: "C6-305M", Cupboard_ID: "CPB-006", Box_ID: "BOX-014", Quantity: "8", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-008", Item_Code: "HUB-ANK", Cupboard_ID: "CPB-004", Box_ID: "BOX-010", Quantity: "35", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-009", Item_Code: "PRES-PNT", Cupboard_ID: "CPB-004", Box_ID: "BOX-011", Quantity: "2", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-010", Item_Code: "HDMI-3M", Cupboard_ID: "CPB-006", Box_ID: "BOX-015", Quantity: "90", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-011", Item_Code: "PRN-BRO", Cupboard_ID: "CPB-005", Box_ID: "BOX-012", Quantity: "0", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-012", Item_Code: "LBL-TPE", Cupboard_ID: "CPB-005", Box_ID: "BOX-013", Quantity: "45", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-013", Item_Code: "AK-BOND", Cupboard_ID: "CPB-003", Box_ID: "BOX-008", Quantity: "12", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-014", Item_Code: "GOG-01", Cupboard_ID: "CPB-002", Box_ID: "BOX-005", Quantity: "120", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-015", Item_Code: "BAT-AA", Cupboard_ID: "CPB-007", Box_ID: "BOX-016", Quantity: "15", Last_Updated: "2026-07-11" },
  { Placement_ID: "PL-016", Item_Code: "SPN-STAN", Cupboard_ID: "CPB-003", Box_ID: "BOX-009", Quantity: "3", Last_Updated: "2026-07-11" }
];

const INVOICES = [
  { Invoice_No: "INV-2026-001", Vendor_Name: "ElectroCorp India", Date: "2026-06-15", Employee_Name: "Admin", Total_Value: "442500", Created_On: "2026-06-15" },
  { Invoice_No: "INV-2026-002", Vendor_Name: "TechParts Solutions", Date: "2026-06-18", Employee_Name: "Admin", Total_Value: "50150", Created_On: "2026-06-18" },
  { Invoice_No: "INV-2026-003", Vendor_Name: "SafetyPro Supplies", Date: "2026-06-20", Employee_Name: "Admin", Total_Value: "89040", Created_On: "2026-06-20" },
  { Invoice_No: "INV-2026-004", Vendor_Name: "Alpha Network Systems", Date: "2026-06-25", Employee_Name: "Admin", Total_Value: "110920", Created_On: "2026-06-25" },
  { Invoice_No: "INV-2026-005", Vendor_Name: "Apex Industrial Tools", Date: "2026-06-19", Employee_Name: "Admin", Total_Value: "30385", Created_On: "2026-06-19" },
  { Invoice_No: "INV-2026-006", Vendor_Name: "TechParts Solutions", Date: "2026-06-20", Employee_Name: "Admin", Total_Value: "112690", Created_On: "2026-06-20" },
  { Invoice_No: "INV-2026-007", Vendor_Name: "OfficeGear Ltd", Date: "2026-06-22", Employee_Name: "Admin", Total_Value: "31860", Created_On: "2026-06-22" },
  { Invoice_No: "INV-2026-008", Vendor_Name: "ElectroCorp India", Date: "2026-06-21", Employee_Name: "Admin", Total_Value: "8850", Created_On: "2026-06-21" }
];

const LEDGER = [
  // 1. Fluke Multimeter (Inward 50, Outward 10. Bal: 40)
  { Entry_ID: "ENT-101", Date_Time: "15-06-2026 10:00", Item_Name: "Digital Multimeter Fluke 115", Item_Code: "FLK-115", HSN_Code: "8544", Location: "Cupboard A", Transaction_Type: "Inward", Inward_Qty: "50", Invoice_No: "INV-2026-001", Invoice_Date: "15-06-2026", GRN_No: "GRN-2026-101", Vendor_Name: "ElectroCorp India", Price_Per_Item: "7500", Discount_Pct: "0", Taxable_Value: "375000", GST_Rate: "18", CGST_Amt: "33750", SGST_Amt: "33750", Total_Invoice_Value: "442500", Outward_Qty: "", Balance_Qty: "50", Employee_Name: "Rajesh Kumar", Received_By: "Rajesh Kumar", Remarks: "Received in good condition" },
  { Entry_ID: "ENT-102", Date_Time: "20-06-2026 14:30", Item_Name: "Digital Multimeter Fluke 115", Item_Code: "FLK-115", HSN_Code: "8544", Location: "Cupboard A", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "10", Issued_To: "QA Lab", Balance_Qty: "40", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Testing workstations setup" },

  // 2. Safety Gloves (Inward 150, Outward 80, Return 10. Bal: 80)
  { Entry_ID: "ENT-103", Date_Time: "16-06-2026 09:30", Item_Name: "Safety Gloves Nitrile", Item_Code: "GLV-01", HSN_Code: "4015", Location: "Cupboard B", Transaction_Type: "Inward", Inward_Qty: "150", Invoice_No: "INV-2026-003", Invoice_Date: "20-06-2026", GRN_No: "GRN-2026-102", Vendor_Name: "SafetyPro Supplies", Price_Per_Item: "150", Discount_Pct: "0", Taxable_Value: "22500", GST_Rate: "12", CGST_Amt: "1350", SGST_Amt: "1350", Total_Invoice_Value: "25200", Outward_Qty: "", Balance_Qty: "150", Employee_Name: "Rajesh Kumar", Received_By: "Rajesh Kumar", Remarks: "Protective wear batch" },
  { Entry_ID: "ENT-104", Date_Time: "22-06-2026 11:00", Item_Name: "Safety Gloves Nitrile", Item_Code: "GLV-01", HSN_Code: "4015", Location: "Cupboard B", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "80", Issued_To: "Electrical Maintenance", Balance_Qty: "70", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Monthly issue for maintenance crews" },
  { Entry_ID: "ENT-105", Date_Time: "26-06-2026 15:30", Item_Name: "Safety Gloves Nitrile", Item_Code: "GLV-01", HSN_Code: "4015", Location: "Cupboard B", Transaction_Type: "Inward", Inward_Qty: "10", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "", Balance_Qty: "80", Employee_Name: "Priya Sharma", Received_By: "Priya Sharma", Remarks: "Return of unused gloves from maintenance" },

  // 3. Soldering Station (Inward 5, Outward 5. Bal: 0)
  { Entry_ID: "ENT-106", Date_Time: "18-06-2026 11:00", Item_Name: "Soldering Station Hakko FX-888D", Item_Code: "HK-888D", HSN_Code: "8515", Location: "Cupboard A", Transaction_Type: "Inward", Inward_Qty: "5", Invoice_No: "INV-2026-002", Invoice_Date: "18-06-2026", GRN_No: "GRN-2026-103", Vendor_Name: "TechParts Solutions", Price_Per_Item: "8500", Discount_Pct: "0", Taxable_Value: "42500", GST_Rate: "18", CGST_Amt: "3825", SGST_Amt: "3825", Total_Invoice_Value: "50150", Outward_Qty: "", Balance_Qty: "5", Employee_Name: "Rajesh Kumar", Received_By: "Rajesh Kumar", Remarks: "Digital soldering units" },
  { Entry_ID: "ENT-107", Date_Time: "25-06-2026 16:15", Item_Name: "Soldering Station Hakko FX-888D", Item_Code: "HK-888D", HSN_Code: "8515", Location: "Cupboard A", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "5", Issued_To: "R&D Lab", Balance_Qty: "0", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Prototype testing lab setup" },

  // 4. Safety Helmet (Inward 60, Outward 10. Bal: 50)
  { Entry_ID: "ENT-108", Date_Time: "16-06-2026 10:15", Item_Name: "Safety Helmet White", Item_Code: "HLM-03", HSN_Code: "6506", Location: "Cupboard B", Transaction_Type: "Inward", Inward_Qty: "60", Invoice_No: "INV-2026-003", Invoice_Date: "20-06-2026", GRN_No: "GRN-2026-104", Vendor_Name: "SafetyPro Supplies", Price_Per_Item: "450", Discount_Pct: "0", Taxable_Value: "27000", GST_Rate: "12", CGST_Amt: "1620", SGST_Amt: "1620", Total_Invoice_Value: "30240", Outward_Qty: "", Balance_Qty: "60", Employee_Name: "Rajesh Kumar", Received_By: "Rajesh Kumar", Remarks: "Safety hardhats" },
  { Entry_ID: "ENT-109", Date_Time: "24-06-2026 14:00", Item_Name: "Safety Helmet White", Item_Code: "HLM-03", HSN_Code: "6506", Location: "Cupboard B", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "10", Issued_To: "Site Engineers", Balance_Qty: "50", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Visitor hardhat kits" },

  // 5. Screwdriver Set (Inward 10, Outward 4. Bal: 6)
  { Entry_ID: "ENT-110", Date_Time: "19-06-2026 12:00", Item_Name: "Screwdriver Set Wiha", Item_Code: "SD-WIHA", HSN_Code: "8205", Location: "Cupboard C", Transaction_Type: "Inward", Inward_Qty: "10", Invoice_No: "INV-2026-005", Invoice_Date: "19-06-2026", GRN_No: "GRN-2026-105", Vendor_Name: "Apex Industrial Tools", Price_Per_Item: "1200", Discount_Pct: "0", Taxable_Value: "12000", GST_Rate: "18", CGST_Amt: "1080", SGST_Amt: "1080", Total_Invoice_Value: "14160", Outward_Qty: "", Balance_Qty: "10", Employee_Name: "Rajesh Kumar", Received_By: "Rajesh Kumar", Remarks: "Insulated hand tools" },
  { Entry_ID: "ENT-111", Date_Time: "28-06-2026 15:00", Item_Name: "Screwdriver Set Wiha", Item_Code: "SD-WIHA", HSN_Code: "8205", Location: "Cupboard C", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "4", Issued_To: "Assembly Line", Balance_Qty: "6", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Replaced damaged station tools" },

  // 6. Crimping Tool (Inward 20, Outward 5. Bal: 15)
  { Entry_ID: "ENT-112", Date_Time: "25-06-2026 09:30", Item_Name: "Crimping Tool RJ45", Item_Code: "CR-RJ45", HSN_Code: "8203", Location: "Cupboard C", Transaction_Type: "Inward", Inward_Qty: "20", Invoice_No: "INV-2026-004", Invoice_Date: "25-06-2026", GRN_No: "GRN-2026-106", Vendor_Name: "Alpha Network Systems", Price_Per_Item: "1200", Discount_Pct: "0", Taxable_Value: "24000", GST_Rate: "18", CGST_Amt: "2160", SGST_Amt: "2160", Total_Invoice_Value: "28320", Outward_Qty: "", Balance_Qty: "20", Employee_Name: "Priya Sharma", Received_By: "Priya Sharma", Remarks: "Pass-through network crimpers" },
  { Entry_ID: "ENT-113", Date_Time: "30-06-2026 11:30", Item_Name: "Crimping Tool RJ45", Item_Code: "CR-RJ45", HSN_Code: "8203", Location: "Cupboard C", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "5", Issued_To: "Networking Team", Balance_Qty: "15", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Server room wiring project" },

  // 7. Cat6 Ethernet Cable (Inward 10, Outward 2. Bal: 8)
  { Entry_ID: "ENT-114", Date_Time: "25-06-2026 10:30", Item_Name: "Cat6 Ethernet Cable 305m", Item_Code: "C6-305M", HSN_Code: "8544", Location: "Store Room A", Transaction_Type: "Inward", Inward_Qty: "10", Invoice_No: "INV-2026-004", Invoice_Date: "25-06-2026", GRN_No: "GRN-2026-107", Vendor_Name: "Alpha Network Systems", Price_Per_Item: "4500", Discount_Pct: "0", Taxable_Value: "45000", GST_Rate: "18", CGST_Amt: "4050", SGST_Amt: "4050", Total_Invoice_Value: "53100", Outward_Qty: "", Balance_Qty: "10", Employee_Name: "Priya Sharma", Received_By: "Priya Sharma", Remarks: "Network cable boxes" },
  { Entry_ID: "ENT-115", Date_Time: "02-07-2026 14:00", Item_Name: "Cat6 Ethernet Cable 305m", Item_Code: "C6-305M", HSN_Code: "8544", Location: "Store Room A", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "2", Issued_To: "Server Room Setup", Balance_Qty: "8", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Structured cabling roll-out" },

  // 8. USB-C Hub (Inward 40, Outward 5. Bal: 35)
  { Entry_ID: "ENT-116", Date_Time: "20-06-2026 11:30", Item_Name: "USB-C Hub 6-in-1 Anker", Item_Code: "HUB-ANK", HSN_Code: "8471", Location: "Cupboard D", Transaction_Type: "Inward", Inward_Qty: "40", Invoice_No: "INV-2026-006", Invoice_Date: "20-06-2026", GRN_No: "GRN-2026-108", Vendor_Name: "TechParts Solutions", Price_Per_Item: "2200", Discount_Pct: "0", Taxable_Value: "88000", GST_Rate: "18", CGST_Amt: "7920", SGST_Amt: "7920", Total_Invoice_Value: "103840", Outward_Qty: "", Balance_Qty: "40", Employee_Name: "Priya Sharma", Received_By: "Priya Sharma", Remarks: "B2B office hubs" },
  { Entry_ID: "ENT-117", Date_Time: "03-07-2026 10:00", Item_Name: "USB-C Hub 6-in-1 Anker", Item_Code: "HUB-ANK", HSN_Code: "8471", Location: "Cupboard D", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "5", Issued_To: "Design Studio", Balance_Qty: "35", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Macbook adapters for designers" },

  // 9. Presenter Clicker (Inward 5, Outward 3. Bal: 2)
  { Entry_ID: "ENT-118", Date_Time: "20-06-2026 12:30", Item_Name: "Wireless Presenter Pointer", Item_Code: "PRES-PNT", HSN_Code: "8471", Location: "Cupboard D", Transaction_Type: "Inward", Inward_Qty: "5", Invoice_No: "INV-2026-006", Invoice_Date: "20-06-2026", GRN_No: "GRN-2026-109", Vendor_Name: "TechParts Solutions", Price_Per_Item: "1500", Discount_Pct: "0", Taxable_Value: "7500", GST_Rate: "18", CGST_Amt: "675", SGST_Amt: "675", Total_Invoice_Value: "8850", Outward_Qty: "", Balance_Qty: "5", Employee_Name: "Priya Sharma", Received_By: "Priya Sharma", Remarks: "Meeting room presenters" },
  { Entry_ID: "ENT-119", Date_Time: "05-07-2026 12:00", Item_Name: "Wireless Presenter Pointer", Item_Code: "PRES-PNT", HSN_Code: "8471", Location: "Cupboard D", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "3", Issued_To: "Sales Team", Balance_Qty: "2", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Issued to sales execs" },

  // 10. HDMI Cable (Inward 100, Outward 10. Bal: 90)
  { Entry_ID: "ENT-120", Date_Time: "25-06-2026 11:30", Item_Name: "HDMI Cable High Speed 3m", Item_Code: "HDMI-3M", HSN_Code: "8544", Location: "Store Room A", Transaction_Type: "Inward", Inward_Qty: "100", Invoice_No: "INV-2026-004", Invoice_Date: "25-06-2026", GRN_No: "GRN-2026-110", Vendor_Name: "Alpha Network Systems", Price_Per_Item: "250", Discount_Pct: "0", Taxable_Value: "25000", GST_Rate: "18", CGST_Amt: "2250", SGST_Amt: "2250", Total_Invoice_Value: "29500", Outward_Qty: "", Balance_Qty: "100", Employee_Name: "Priya Sharma", Received_By: "Priya Sharma", Remarks: "Display cables" },
  { Entry_ID: "ENT-121", Date_Time: "06-07-2026 15:30", Item_Name: "HDMI Cable High Speed 3m", Item_Code: "HDMI-3M", HSN_Code: "8544", Location: "Store Room A", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "10", Issued_To: "Conference Rooms", Balance_Qty: "90", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Setup for meeting rooms" },

  // 11. Label Printer (Inward 2, Outward 2. Bal: 0)
  { Entry_ID: "ENT-122", Date_Time: "22-06-2026 10:00", Item_Name: "Label Printer Brother PT-D210", Item_Code: "PRN-BRO", HSN_Code: "8443", Location: "Cupboard E", Transaction_Type: "Inward", Inward_Qty: "2", Invoice_No: "INV-2026-007", Invoice_Date: "22-06-2026", GRN_No: "GRN-2026-111", Vendor_Name: "OfficeGear Ltd", Price_Per_Item: "3500", Discount_Pct: "0", Taxable_Value: "7000", GST_Rate: "18", CGST_Amt: "630", SGST_Amt: "630", Total_Invoice_Value: "8260", Outward_Qty: "", Balance_Qty: "2", Employee_Name: "Priya Sharma", Received_By: "Priya Sharma", Remarks: "Asset tagging printers" },
  { Entry_ID: "ENT-123", Date_Time: "08-07-2026 16:30", Item_Name: "Label Printer Brother PT-D210", Item_Code: "PRN-BRO", HSN_Code: "8443", Location: "Cupboard E", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "2", Issued_To: "Dispatch Desk", Balance_Qty: "0", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Sent to new warehouse desks" },

  // 12. Label Tape (Inward 50, Outward 5. Bal: 45)
  { Entry_ID: "ENT-124", Date_Time: "22-06-2026 10:15", Item_Name: "Self-Adhesive Labels Tape", Item_Code: "LBL-TPE", HSN_Code: "3919", Location: "Cupboard E", Transaction_Type: "Inward", Inward_Qty: "50", Invoice_No: "INV-2026-007", Invoice_Date: "22-06-2026", GRN_No: "GRN-2026-112", Vendor_Name: "OfficeGear Ltd", Price_Per_Item: "400", Discount_Pct: "0", Taxable_Value: "20000", GST_Rate: "18", CGST_Amt: "1800", SGST_Amt: "1800", Total_Invoice_Value: "23600", Outward_Qty: "", Balance_Qty: "50", Employee_Name: "Priya Sharma", Received_By: "Priya Sharma", Remarks: "Cartridge supply" },
  { Entry_ID: "ENT-125", Date_Time: "09-07-2026 11:00", Item_Name: "Self-Adhesive Labels Tape", Item_Code: "LBL-TPE", HSN_Code: "3919", Location: "Cupboard E", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "5", Issued_To: "Admin Team", Balance_Qty: "45", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Office asset cataloguing" },

  // 13. Allen Keys (Inward 15, Outward 3. Bal: 12)
  { Entry_ID: "ENT-126", Date_Time: "19-06-2026 12:15", Item_Name: "Allen Key Set Bondhus", Item_Code: "AK-BOND", HSN_Code: "8204", Location: "Cupboard C", Transaction_Type: "Inward", Inward_Qty: "15", Invoice_No: "INV-2026-005", Invoice_Date: "19-06-2026", GRN_No: "GRN-2026-113", Vendor_Name: "Apex Industrial Tools", Price_Per_Item: "650", Discount_Pct: "0", Taxable_Value: "9750", GST_Rate: "18", CGST_Amt: "877.5", SGST_Amt: "877.5", Total_Invoice_Value: "11505", Outward_Qty: "", Balance_Qty: "15", Employee_Name: "Rajesh Kumar", Received_By: "Rajesh Kumar", Remarks: "Workshop hex sets" },
  { Entry_ID: "ENT-127", Date_Time: "10-07-2026 14:45", Item_Name: "Allen Key Set Bondhus", Item_Code: "AK-BOND", HSN_Code: "8204", Location: "Cupboard C", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "3", Issued_To: "Mechanical Lab", Balance_Qty: "12", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Replaced misplaced sets" },

  // 14. Safety Goggles (Inward 150, Outward 30. Bal: 120)
  { Entry_ID: "ENT-128", Date_Time: "16-06-2026 10:30", Item_Name: "Safety Goggles Clear", Item_Code: "GOG-01", HSN_Code: "9004", Location: "Cupboard B", Transaction_Type: "Inward", Inward_Qty: "150", Invoice_No: "INV-2026-003", Invoice_Date: "20-06-2026", GRN_No: "GRN-2026-114", Vendor_Name: "SafetyPro Supplies", Price_Per_Item: "200", Discount_Pct: "0", Taxable_Value: "30000", GST_Rate: "12", CGST_Amt: "1800", SGST_Amt: "1800", Total_Invoice_Value: "33600", Outward_Qty: "", Balance_Qty: "150", Employee_Name: "Rajesh Kumar", Received_By: "Rajesh Kumar", Remarks: "Anti-fog goggles" },
  { Entry_ID: "ENT-129", Date_Time: "11-07-2026 15:00", Item_Name: "Safety Goggles Clear", Item_Code: "GOG-01", HSN_Code: "9004", Location: "Cupboard B", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "30", Issued_To: "Chemical Division", Balance_Qty: "120", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "New interns laboratory batch" },

  // 15. AA Batteries (Inward 25, Outward 10. Bal: 15)
  { Entry_ID: "ENT-130", Date_Time: "21-06-2026 13:00", Item_Name: "Rechargeable AA Batteries 4-Pack", Item_Code: "BAT-AA", HSN_Code: "8506", Location: "Store Room B", Transaction_Type: "Inward", Inward_Qty: "25", Invoice_No: "INV-2026-008", Invoice_Date: "21-06-2026", GRN_No: "GRN-2026-115", Vendor_Name: "ElectroCorp India", Price_Per_Item: "300", Discount_Pct: "0", Taxable_Value: "7500", GST_Rate: "18", CGST_Amt: "675", SGST_Amt: "675", Total_Invoice_Value: "8850", Outward_Qty: "", Balance_Qty: "25", Employee_Name: "Priya Sharma", Received_By: "Priya Sharma", Remarks: "Seeded battery packs" },
  { Entry_ID: "ENT-131", Date_Time: "07-07-2026 10:15", Item_Name: "Rechargeable AA Batteries 4-Pack", Item_Code: "BAT-AA", HSN_Code: "8506", Location: "Store Room B", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "10", Issued_To: "IT Support", Balance_Qty: "15", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Wireless keyboard swap project" },

  // 16. Spanners (Inward 5, Outward 2. Bal: 3)
  { Entry_ID: "ENT-132", Date_Time: "19-06-2026 12:30", Item_Name: "Adjustable Spanner Stanley", Item_Code: "SPN-STAN", HSN_Code: "8204", Location: "Cupboard C", Transaction_Type: "Inward", Inward_Qty: "5", Invoice_No: "INV-2026-005", Invoice_Date: "19-06-2026", GRN_No: "GRN-2026-116", Vendor_Name: "Apex Industrial Tools", Price_Per_Item: "800", Discount_Pct: "0", Taxable_Value: "4000", GST_Rate: "18", CGST_Amt: "360", SGST_Amt: "360", Total_Invoice_Value: "4720", Outward_Qty: "", Balance_Qty: "5", Employee_Name: "Rajesh Kumar", Received_By: "Rajesh Kumar", Remarks: "Heavy duty spanners" },
  { Entry_ID: "ENT-133", Date_Time: "08-07-2026 14:00", Item_Name: "Adjustable Spanner Stanley", Item_Code: "SPN-STAN", HSN_Code: "8204", Location: "Cupboard C", Transaction_Type: "Outward", Inward_Qty: "", Invoice_No: "", Invoice_Date: "", GRN_No: "", Vendor_Name: "", Price_Per_Item: "", Discount_Pct: "", Taxable_Value: "", GST_Rate: "", CGST_Amt: "", SGST_Amt: "", Total_Invoice_Value: "", Outward_Qty: "2", Issued_To: "Tool workshop", Balance_Qty: "3", Employee_Name: "Rajesh Kumar", Received_By: "", Remarks: "Replaced worn spanners at workshop bench" }
];

const NOTICE_BOARD = [
  { Notice_ID: "NOT-001", Title: "Annual Inventory Audit", Content: "Please ensure all cupboards and boxes are verified before July 15th.", Priority: "Critical", Posted_By: "Admin", Date_Time: "11-07-2026 10:00", Expiry: "15-07-2026" },
  { Notice_ID: "NOT-002", Title: "New Tools Cabinets Added", Content: "Cupboard C (Tools Workshop) has been reorganized. Please refer to the Storage Map for updated box layouts.", Priority: "Low", Posted_By: "Admin", Date_Time: "11-07-2026 11:00", Expiry: "25-07-2026" },
  { Notice_ID: "NOT-003", Title: "Restock Requisition: Soldering Stations", Content: "Soldering Stations are completely out of stock. Assigned to Rajesh Kumar to place purchase order.", Priority: "Warning", Posted_By: "Admin", Date_Time: "11-07-2026 12:00", Expiry: "18-07-2026" }
];

const TASKS = [
  { Task_ID: "TSK-001", Assigned_To_User_ID: "USR-002", Text: "Restock Requisition: Soldering Stations - Place purchase order for 10 Hakko FX-888D units.", Created_By: "Admin", Notice_ID: "NOT-003", Status: "Pending", Created_On: "11-07-2026 12:00" }
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

// Post rows with retries and delay to prevent server overload
async function postRowWithRetry(tab, data, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await postRow(tab, data);
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed for ${tab} (${data.Item_Name || data.Vendor_Name || data.Entry_ID || data.Box_Name || data.Placement_ID}): ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function run() {
  try {
    console.log('Inserting Vendors...');
    for (const v of VENDORS) {
      await postRowWithRetry('Vendors', v);
      console.log(`- Inserted Vendor: ${v.Vendor_Name}`);
    }

    console.log('Inserting Users...');
    for (const u of USERS) {
      await postRowWithRetry('Users', u);
      console.log(`- Inserted User: ${u.Full_Name}`);
    }

    console.log('Inserting Cupboards...');
    for (const c of CUPBOARDS) {
      await postRowWithRetry('Cupboards', c);
      console.log(`- Inserted Cupboard: ${c.Name}`);
    }

    console.log('Inserting Boxes...');
    for (const b of BOXES) {
      await postRowWithRetry('Boxes', b);
      console.log(`- Inserted Box: ${b.Box_Name} under Cupboard ID: ${b.Cupboard_ID}`);
    }

    console.log('Inserting Item Catalogue (Item_Master)...');
    for (const item of ITEMS) {
      await postRowWithRetry('Item_Master', item);
      console.log(`- Inserted Item: ${item.Item_Name}`);
    }

    console.log('Inserting Placements...');
    for (const p of PLACEMENTS) {
      await postRowWithRetry('Placements', p);
      console.log(`- Inserted Placement: ${p.Placement_ID} (${p.Item_Code})`);
    }

    console.log('Inserting Invoices...');
    for (const inv of INVOICES) {
      await postRowWithRetry('Invoices', inv);
      console.log(`- Inserted Invoice: ${inv.Invoice_No} with Total Value: ${inv.Total_Value}`);
    }

    console.log('Inserting Stock Ledger Entries...');
    for (const entry of LEDGER) {
      await postRowWithRetry('Stock_Register', entry);
      console.log(`- Inserted Ledger Entry: ${entry.Entry_ID} (${entry.Item_Name})`);
    }

    console.log('Inserting Notice Board...');
    for (const notice of NOTICE_BOARD) {
      await postRowWithRetry('Notice_Board', notice);
      console.log(`- Inserted Notice: ${notice.Title}`);
    }

    console.log('Inserting Tasks...');
    for (const task of TASKS) {
      await postRowWithRetry('Tasks', task);
      console.log(`- Inserted Task: ${task.Task_ID}`);
    }

    console.log('ALL DEMO DATA SEEDED SUCCESSFULLY!');
  } catch (err) {
    console.error('Execution failed:', err);
  }
}

run();
