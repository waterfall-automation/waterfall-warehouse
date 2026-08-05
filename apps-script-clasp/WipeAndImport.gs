// WipeAndImport.gs — Generated reset and import script
// Triggered via GET ?action=wipeAndImportInventory

function handleWipeAndImportInventory(ss) {
  ss = ss || getSpreadsheet();
  
  // 1. Wipe data rows from specified sheets (keep row 1 headers)
  var sheetsToWipe = ['Item_Master', 'Stock_Register', 'Cupboards', 'Boxes', 'Placements'];
  var wipedSummary = [];
  
  sheetsToWipe.forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (sh) {
      var lastRow = sh.getLastRow();
      var lastCol = sh.getLastColumn();
      if (lastRow > 1 && lastCol > 0) {
        sh.getRange(2, 1, lastRow - 1, lastCol).clearContent();
      }
      wipedSummary.push(name);
    }
  });

  // 2. Create Cupboards CB1 through CB13
  var cupboardsSheet = ss.getSheetByName('Cupboards');
  var cbMap = {}; // Maps Cupboard_Number to Cupboard_ID
  var cbRows = [];
  
  for (var i = 1; i <= 13; i++) {
    var cbNum = 'CB' + i;
    var cbId = generateId('CUP');
    cbMap[cbNum] = cbId;
    
    cbRows.push([
      cbId,
      cbNum,
      'Cupboard ' + i, // Name
      '', // Location
      '', // Description
      '', // Image_URL
      '#1B3A6B', // Color (default navy/blue)
      'Active', // Status
      formatDateTime(),
      'Cupboard' // Type
    ]);
  }
  if (cbRows.length > 0) {
    cupboardsSheet.getRange(2, 1, cbRows.length, cbRows[0].length).setValues(cbRows);
    var extraRows = cupboardsSheet.getLastRow() - (1 + cbRows.length);
    if (extraRows > 0) {
      cupboardsSheet.deleteRows(2 + cbRows.length, extraRows);
    }
  }

  // 3. Parsed items data
  var rawItems = [
  {
    "cupboard": "CB1",
    "box": null,
    "name": "Rope",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "Rope — 1"
  },
  {
    "cupboard": "CB1",
    "box": null,
    "name": "Relay coil",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "Relay coil — 4"
  },
  {
    "cupboard": "CB1",
    "box": null,
    "name": "Switch",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "Switch — 10"
  },
  {
    "cupboard": "CB1",
    "box": null,
    "name": "4-way MCB",
    "qty": 6,
    "isUnclear": false,
    "originalLine": "4-way MCB — 6"
  },
  {
    "cupboard": "CB1",
    "box": null,
    "name": "MCB (SP) (10)",
    "qty": 6,
    "isUnclear": false,
    "originalLine": "MCB (SP) (10) — 1 box (6 units) [treat qty as 6]"
  },
  {
    "cupboard": "CB1",
    "box": null,
    "name": "Relay Socket",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "Relay Socket — 3"
  },
  {
    "cupboard": "CB1",
    "box": null,
    "name": "1.5mm wire (polycab)",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "1.5mm wire (polycab) — 1"
  },
  {
    "cupboard": "CB1",
    "box": null,
    "name": "3 Pin Plug",
    "qty": 7,
    "isUnclear": false,
    "originalLine": "3 Pin Plug — 7"
  },
  {
    "cupboard": "CB1",
    "box": null,
    "name": "Stabilizer (Voltguard)",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "Stabilizer (Voltguard) — 1"
  },
  {
    "cupboard": "CB1",
    "box": null,
    "name": "6-way Modular Surface Gang Box",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "6-way Modular Surface Gang Box — 5"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "Battery Holder",
    "qty": 11,
    "isUnclear": false,
    "originalLine": "Battery Holder — 11"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "PBF-4",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "PBF-4 — 20"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "Charging Module",
    "qty": 8,
    "isUnclear": false,
    "originalLine": "Charging Module — 8"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "T2C",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "T2C — 1"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "Breast Corw",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "Breast Corw — 10"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "GY-302",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "GY-302 — 3"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "Cable Glands",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "Cable Glands — 10"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "LoRa",
    "qty": 7,
    "isUnclear": false,
    "originalLine": "LoRa — 7"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "Fuse Holder",
    "qty": 48,
    "isUnclear": false,
    "originalLine": "Fuse Holder — 48"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "SS24",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "SS24 — 1"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "Switches",
    "qty": 17,
    "isUnclear": false,
    "originalLine": "Switches — 17"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "Antenna Coil",
    "qty": 9,
    "isUnclear": false,
    "originalLine": "Antenna Coil — 9"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "Antenna",
    "qty": 24,
    "isUnclear": false,
    "originalLine": "Antenna — 24"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "GPS Antenna",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "GPS Antenna — 2"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "Old Euro Antenna Cable",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "Old Euro Antenna Cable — 15"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "New Euro Antenna Cable",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "New Euro Antenna Cable — 5"
  },
  {
    "cupboard": "CB5",
    "box": "Box 1",
    "name": "Cover",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "Cover — 15"
  },
  {
    "cupboard": "CB5",
    "box": "Box 2",
    "name": "Conn - JST - 5P",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "Conn - JST - 5P — 25"
  },
  {
    "cupboard": "CB5",
    "box": "Box 2",
    "name": "Conn - JST - 2P",
    "qty": 66,
    "isUnclear": false,
    "originalLine": "Conn - JST - 2P — 66"
  },
  {
    "cupboard": "CB5",
    "box": "Box 2",
    "name": "Conn - JST - 3P",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "Conn - JST - 3P — 30"
  },
  {
    "cupboard": "CB5",
    "box": "Box 2",
    "name": "Conn - JST - 4P",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "Conn - JST - 4P — 25"
  },
  {
    "cupboard": "CB5",
    "box": "Box 2",
    "name": "Conn - JST - 9P",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "Conn - JST - 9P — 10"
  },
  {
    "cupboard": "CB5",
    "box": "Box 2",
    "name": "Conn - JST - 6P",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "Conn - JST - 6P — 25"
  },
  {
    "cupboard": "CB5",
    "box": "Box 2",
    "name": "Conn - JST - 7P",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "Conn - JST - 7P — 15"
  },
  {
    "cupboard": "CB5",
    "box": "Box-3 (Terminal Connectors + Resistance)",
    "name": "Terminal Connector - 3 pin",
    "qty": 70,
    "isUnclear": false,
    "originalLine": "Terminal Connector - 3 pin — 70"
  },
  {
    "cupboard": "CB5",
    "box": "Box-3 (Terminal Connectors + Resistance)",
    "name": "Terminal Connector - 2 pin",
    "qty": 7,
    "isUnclear": false,
    "originalLine": "Terminal Connector - 2 pin — 7"
  },
  {
    "cupboard": "CB5",
    "box": "Box-3 (Terminal Connectors + Resistance)",
    "name": "Terminal Connector - 4 pin",
    "qty": 8,
    "isUnclear": false,
    "originalLine": "Terminal Connector - 4 pin — 8"
  },
  {
    "cupboard": "CB5",
    "box": "Box-3 (Terminal Connectors + Resistance)",
    "name": "Terminal Connector - 2 pin (25)",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "Terminal Connector - 2 pin (25) — 25"
  },
  {
    "cupboard": "CB5",
    "box": "Box-3 (Terminal Connectors + Resistance)",
    "name": "Terminal Connector - 6 pin",
    "qty": 7,
    "isUnclear": false,
    "originalLine": "Terminal Connector - 6 pin — 7"
  },
  {
    "cupboard": "CB5",
    "box": "Box-3 (Terminal Connectors + Resistance)",
    "name": "Resistance Box (1 to 2.2M ohm)",
    "qty": 8,
    "isUnclear": false,
    "originalLine": "Resistance Box (1 to 2.2M ohm) — 8"
  },
  {
    "cupboard": "CB5",
    "box": "Box-4 (Misc/JST + Green Connectors)",
    "name": "JST Connector - 3 pin",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "JST Connector - 3 pin — 30"
  },
  {
    "cupboard": "CB5",
    "box": "Box-4 (Misc/JST + Green Connectors)",
    "name": "JST Connector - 2 pin",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "JST Connector - 2 pin — 30"
  },
  {
    "cupboard": "CB5",
    "box": "Box-4 (Misc/JST + Green Connectors)",
    "name": "JST Connector - 5 pin",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "JST Connector - 5 pin — 15"
  },
  {
    "cupboard": "CB5",
    "box": "Box-4 (Misc/JST + Green Connectors)",
    "name": "JST Connector - 10 pin",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "JST Connector - 10 pin — 5"
  },
  {
    "cupboard": "CB5",
    "box": "Box-4 (Misc/JST + Green Connectors)",
    "name": "JST Connector - 4 pin",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "JST Connector - 4 pin — 1"
  },
  {
    "cupboard": "CB5",
    "box": "Box-4 (Misc/JST + Green Connectors)",
    "name": "Green Connector - 2 pin",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "Green Connector - 2 pin — 25"
  },
  {
    "cupboard": "CB5",
    "box": "Box-4 (Misc/JST + Green Connectors)",
    "name": "Green Connector - 6 pin FM",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "Green Connector - 6 pin FM — 4"
  },
  {
    "cupboard": "CB5",
    "box": "Box-4 (Misc/JST + Green Connectors)",
    "name": "Green Connector - 3 pin FM",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "Green Connector - 3 pin FM — 4"
  },
  {
    "cupboard": "CB5",
    "box": "Box-4 (Misc/JST + Green Connectors)",
    "name": "Antenna Connector",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Antenna Connector — 0"
  },
  {
    "cupboard": "CB5",
    "box": "Box-5 (Jumper Wire)",
    "name": "Jumper Wire + Connector - 7 pin",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Jumper Wire + Connector - 7 pin — 0"
  },
  {
    "cupboard": "CB5",
    "box": "Box-5 (Jumper Wire)",
    "name": "Jumper Wire + Connector - 6 pin",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Jumper Wire + Connector - 6 pin — 0"
  },
  {
    "cupboard": "CB5",
    "box": "Box-6 (Single/Dual Pin)",
    "name": "Single Pin Male + Female",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Single Pin Male + Female — 0"
  },
  {
    "cupboard": "CB5",
    "box": "Box-6 (Single/Dual Pin)",
    "name": "Dual Pin Male + Female",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Dual Pin Male + Female — 0"
  },
  {
    "cupboard": "CB5",
    "box": "Box-7 (Spacers)",
    "name": "Screws + Hexagonal Spacers - 15mm",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Screws + Hexagonal Spacers - 15mm — 0"
  },
  {
    "cupboard": "CB5",
    "box": "Box-9",
    "name": "JST Connector - 3 pin",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "JST Connector - 3 pin — 0"
  },
  {
    "cupboard": "CB5",
    "box": "Box-9",
    "name": "JST Connector - 10 pin",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "JST Connector - 10 pin — 0"
  },
  {
    "cupboard": "CB5",
    "box": "Box-9",
    "name": "JST Connector - 5 pin",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "JST Connector - 5 pin — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-10",
    "name": "LoRa Autoswitch reset PCB",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "LoRa Autoswitch reset PCB — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-11",
    "name": "OP07CP",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "OP07CP — 25"
  },
  {
    "cupboard": "CB6",
    "box": "Box-11",
    "name": "LM358",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "LM358 — 5"
  },
  {
    "cupboard": "CB6",
    "box": "Box-11",
    "name": "LM339",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "LM339 — 3"
  },
  {
    "cupboard": "CB6",
    "box": "Box-11",
    "name": "PC817",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "PC817 — 5"
  },
  {
    "cupboard": "CB6",
    "box": "Box-11",
    "name": "LTV844",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "LTV844 — 30"
  },
  {
    "cupboard": "CB6",
    "box": "Box-11",
    "name": "LM324",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "LM324 — 2"
  },
  {
    "cupboard": "CB6",
    "box": "Box-12",
    "name": "Arduino Uno + GSM module (A7600)",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "Arduino Uno + GSM module (A7600) — 5"
  },
  {
    "cupboard": "CB6",
    "box": "Box-13",
    "name": "74LS47",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "74LS47 — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-13",
    "name": "CD4060",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "CD4060 — 3"
  },
  {
    "cupboard": "CB6",
    "box": "Box-13",
    "name": "74LS90",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "74LS90 — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-13",
    "name": "74HC76",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "74HC76 — 3"
  },
  {
    "cupboard": "CB6",
    "box": "Box-13",
    "name": "CD40988E",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "CD40988E — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-13",
    "name": "74HCU04",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "74HCU04 — 3"
  },
  {
    "cupboard": "CB6",
    "box": "Box-13",
    "name": "74HC123D",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "74HC123D — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-13",
    "name": "LM2917",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "LM2917 — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-13",
    "name": "NE555",
    "qty": 6,
    "isUnclear": false,
    "originalLine": "NE555 — 6"
  },
  {
    "cupboard": "CB6",
    "box": "Box-14",
    "name": "7805",
    "qty": 6,
    "isUnclear": false,
    "originalLine": "7805 — 6"
  },
  {
    "cupboard": "CB6",
    "box": "Box-14",
    "name": "ULN2003APG",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "ULN2003APG — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-14",
    "name": "MCP1703",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "MCP1703 — 3"
  },
  {
    "cupboard": "CB6",
    "box": "Box-14",
    "name": "L12A8",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "L12A8 — 2"
  },
  {
    "cupboard": "CB6",
    "box": "Box-15",
    "name": "Relays",
    "qty": 50,
    "isUnclear": false,
    "originalLine": "Relays — 50"
  },
  {
    "cupboard": "CB6",
    "box": "Box-15",
    "name": "Controller PCB Board",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Controller PCB Board — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-16",
    "name": "Buck Convertor",
    "qty": 7,
    "isUnclear": false,
    "originalLine": "Buck Convertor — 7"
  },
  {
    "cupboard": "CB6",
    "box": "Box-16",
    "name": "Capacitor (330uF/25V)",
    "qty": 17,
    "isUnclear": false,
    "originalLine": "Capacitor (330uF/25V) — 17"
  },
  {
    "cupboard": "CB6",
    "box": "Box-16",
    "name": "BH1750 Light Intensity Sensor",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "BH1750 Light Intensity Sensor — 3"
  },
  {
    "cupboard": "CB6",
    "box": "Box-16",
    "name": "SHT20",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "SHT20 — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-17 (Jar)",
    "name": "ELB17638 IC",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "ELB17638 IC — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-17 (Jar)",
    "name": "SS34 Diode",
    "qty": 29,
    "isUnclear": false,
    "originalLine": "SS34 Diode — 29"
  },
  {
    "cupboard": "CB6",
    "box": "Box-17 (Jar)",
    "name": "100uF Capacitor",
    "qty": 200,
    "isUnclear": false,
    "originalLine": "100uF Capacitor — 200"
  },
  {
    "cupboard": "CB6",
    "box": "Box-17 (Jar)",
    "name": "180E Resistor",
    "qty": 35,
    "isUnclear": false,
    "originalLine": "180E Resistor — 35"
  },
  {
    "cupboard": "CB6",
    "box": "Box-17 (Jar)",
    "name": "10uF 63V Capacitor",
    "qty": 200,
    "isUnclear": false,
    "originalLine": "10uF 63V Capacitor — 200"
  },
  {
    "cupboard": "CB6",
    "box": "Box-17 (Jar)",
    "name": "Diode 2N3904",
    "qty": 35,
    "isUnclear": false,
    "originalLine": "Diode 2N3904 — 35"
  },
  {
    "cupboard": "CB6",
    "box": "Box-17 (Jar)",
    "name": "330E Resistor",
    "qty": 200,
    "isUnclear": false,
    "originalLine": "330E Resistor — 200"
  },
  {
    "cupboard": "CB6",
    "box": "Box-17 (Jar)",
    "name": "LED KST2040J",
    "qty": 500,
    "isUnclear": false,
    "originalLine": "LED KST2040J — 500"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "KST1014 IC",
    "qty": 9,
    "isUnclear": false,
    "originalLine": "KST1014 IC — 9"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "1uF Capacitor",
    "qty": 51,
    "isUnclear": false,
    "originalLine": "1uF Capacitor — 51"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "1nF Capacitor",
    "qty": 300,
    "isUnclear": false,
    "originalLine": "1nF Capacitor — 300"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "SIN/10nF Capacitor",
    "qty": 600,
    "isUnclear": false,
    "originalLine": "SIN/10nF Capacitor — 600"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "47uF 25V Capacitor",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "47uF 25V Capacitor — 25"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "0.22uF Capacitor",
    "qty": 35,
    "isUnclear": false,
    "originalLine": "0.22uF Capacitor — 35"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "FZ84NS IC",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "FZ84NS IC — 3"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "CT",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "CT — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "74HC3791C",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "74HC3791C — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "LM358 SMD",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "LM358 SMD — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "9 Ohm Resistor",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "9 Ohm Resistor — 4"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "300 Ohm Resistor",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "300 Ohm Resistor — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "0.1 Ohm Resistance",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "0.1 Ohm Resistance — 25"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "1N5822 Power Diode",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "1N5822 Power Diode — 25"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "4007 Diode SOD",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "4007 Diode SOD — 10"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "P6KA 100A Diode",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "P6KA 100A Diode — 3"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "SMVT5 BCA",
    "qty": 50,
    "isUnclear": false,
    "originalLine": "SMVT5 BCA — 50"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "200uF Capacitor",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "200uF Capacitor — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "4.7uH Inductor",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "4.7uH Inductor — 30"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "Red LED",
    "qty": 6,
    "isUnclear": false,
    "originalLine": "Red LED — 6"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "ICS189 Diode",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "ICS189 Diode — 20"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "MVR3340",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "MVR3340 — 30"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "Diode 4148",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "Diode 4148 — 10"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "SMVT50CA",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "SMVT50CA — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "SMWT 33CA",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "SMWT 33CA — 20"
  },
  {
    "cupboard": "CB6",
    "box": "Box-18",
    "name": "RSW40 100 Ohm",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "RSW40 100 Ohm — 30"
  },
  {
    "cupboard": "CB6",
    "box": "Box-19",
    "name": "Zener Diode 12V",
    "qty": 50,
    "isUnclear": false,
    "originalLine": "Zener Diode 12V — 50"
  },
  {
    "cupboard": "CB6",
    "box": "Box-19",
    "name": "R050 Resistor",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "R050 Resistor — 10"
  },
  {
    "cupboard": "CB6",
    "box": "Box-19",
    "name": "RSV72",
    "qty": 150,
    "isUnclear": false,
    "originalLine": "RSV72 — 150"
  },
  {
    "cupboard": "CB6",
    "box": "Box-19",
    "name": "RF540N Mosfet",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "RF540N Mosfet — 30"
  },
  {
    "cupboard": "CB6",
    "box": "Box-19",
    "name": "Switches",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "Switches — 10"
  },
  {
    "cupboard": "CB6",
    "box": "Box-19",
    "name": "USBASP ISP Programmer",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "USBASP ISP Programmer — 5"
  },
  {
    "cupboard": "CB6",
    "box": "Box-19",
    "name": "470uF 25V Capacitor",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "470uF 25V Capacitor — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-20",
    "name": "Transformer 12V",
    "qty": 50,
    "isUnclear": false,
    "originalLine": "Transformer 12V — 50"
  },
  {
    "cupboard": "CB6",
    "box": "Box-20",
    "name": "1.6K Resistor",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "1.6K Resistor — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-20",
    "name": "MC5285",
    "qty": 100,
    "isUnclear": false,
    "originalLine": "MC5285 — 100"
  },
  {
    "cupboard": "CB6",
    "box": "Box-20",
    "name": "100pF Ceramic Capacitor",
    "qty": 8,
    "isUnclear": false,
    "originalLine": "100pF Ceramic Capacitor — 8"
  },
  {
    "cupboard": "CB6",
    "box": "Box-20",
    "name": "CDC LVC1102 PW IC",
    "qty": 9,
    "isUnclear": false,
    "originalLine": "CDC LVC1102 PW IC — 9"
  },
  {
    "cupboard": "CB6",
    "box": "Box-20",
    "name": "MCP 5V Regulator",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "MCP 5V Regulator — 20"
  },
  {
    "cupboard": "CB6",
    "box": "Box-20",
    "name": "CDC6100",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "CDC6100 — 10"
  },
  {
    "cupboard": "CB6",
    "box": "Box-20",
    "name": "V1602 IC",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "V1602 IC — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-20",
    "name": "SMD LED",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "SMD LED — 10"
  },
  {
    "cupboard": "CB6",
    "box": "Box-20",
    "name": "150K Resistance",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "150K Resistance — 20"
  },
  {
    "cupboard": "CB6",
    "box": "Box-20",
    "name": "MOSFET P-channel 30V 30A SOT23",
    "qty": 50,
    "isUnclear": false,
    "originalLine": "MOSFET P-channel 30V 30A SOT23 — 50"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "Fixed Inductor 2.2uH 5-4A SMD",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Fixed Inductor 2.2uH 5-4A SMD — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "2N7000",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "2N7000 — 10"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "Capacitor 4700uF",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "Capacitor 4700uF — 5"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "Toggle Switch",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "Toggle Switch — 25"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "GY521",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "GY521 — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "Bare PCB",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "Bare PCB — 3"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "1500uF Capacitor",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "1500uF Capacitor — 2"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "Power Diode",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "Power Diode — 4"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "Antenna Cable",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "Antenna Cable — 3"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "Capacitor 2.2uF 400V",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "Capacitor 2.2uF 400V — 5"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "103J100",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "103J100 — 2"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "MOC8021",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "MOC8021 — 10"
  },
  {
    "cupboard": "CB6",
    "box": "Box-21",
    "name": "Spacer",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Spacer — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-22",
    "name": "Quectel M95",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "Quectel M95 — 15"
  },
  {
    "cupboard": "CB6",
    "box": "Box-22",
    "name": "74HC14L",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "74HC14L — 4"
  },
  {
    "cupboard": "CB6",
    "box": "Box-22",
    "name": "SMBS15",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "SMBS15 — 5"
  },
  {
    "cupboard": "CB6",
    "box": "Box-22",
    "name": "BC517 Transistor",
    "qty": 9,
    "isUnclear": false,
    "originalLine": "BC517 Transistor — 9"
  },
  {
    "cupboard": "CB6",
    "box": "Box-22",
    "name": "DC Regulator 32V",
    "qty": 9,
    "isUnclear": false,
    "originalLine": "DC Regulator 32V — 9"
  },
  {
    "cupboard": "CB6",
    "box": "Box-22",
    "name": "N Mosfet L4SDB",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "N Mosfet L4SDB — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-22",
    "name": "SIM Card Socket",
    "qty": 200,
    "isUnclear": false,
    "originalLine": "SIM Card Socket — 200"
  },
  {
    "cupboard": "CB6",
    "box": "Box-22",
    "name": "MIC Holder",
    "qty": 12,
    "isUnclear": false,
    "originalLine": "MIC Holder — 12"
  },
  {
    "cupboard": "CB6",
    "box": "Box-22",
    "name": "1O9",
    "qty": 39,
    "isUnclear": false,
    "originalLine": "1O9 — 39"
  },
  {
    "cupboard": "CB6",
    "box": "Box-22",
    "name": "IC Vreg LDO 250mA to 32.3mA",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "IC Vreg LDO 250mA to 32.3mA — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-22",
    "name": "NCW Mosfet",
    "qty": 50,
    "isUnclear": false,
    "originalLine": "NCW Mosfet — 50"
  },
  {
    "cupboard": "CB6",
    "box": "Box-23",
    "name": "Single + Double PM Connectors",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Single + Double PM Connectors — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-24",
    "name": "I2C",
    "qty": 7,
    "isUnclear": false,
    "originalLine": "I2C — 7"
  },
  {
    "cupboard": "CB6",
    "box": "Box-24",
    "name": "LCD 20x4 Display",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "LCD 20x4 Display — 1"
  },
  {
    "cupboard": "CB6",
    "box": "Box-25",
    "name": "Soil + Temp Sensor",
    "qty": 16,
    "isUnclear": false,
    "originalLine": "Soil + Temp Sensor — 16"
  },
  {
    "cupboard": "CB6",
    "box": "Box-25",
    "name": "AHT21B V1.1",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "AHT21B V1.1 — 25"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "SN74HC4X40DT",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "SN74HC4X40DT — 4"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "MC1648B",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "MC1648B — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "RPOT 10K",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "RPOT 10K — 4"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "Inductor 10.5mH",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Inductor 10.5mH — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "RPOT 5K",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "RPOT 5K — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "Oscillator 78MHz",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "Oscillator 78MHz — 10"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "Op-amp 5.5Vin 80Hz",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Op-amp 5.5Vin 80Hz — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "Inductor 17.5nH",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "Inductor 17.5nH — 10"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "MCP1703 5V",
    "qty": 8,
    "isUnclear": false,
    "originalLine": "MCP1703 5V — 8"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "LM331N",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "LM331N — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "Soil Moisture PCB",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Soil Moisture PCB — 0"
  },
  {
    "cupboard": "CB6",
    "box": "Box-26",
    "name": "Variable Capacitor",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Variable Capacitor — 0"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "Plastic Bags Box",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Plastic Bags Box — 0"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "Wire bundle box",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Wire bundle box — 0"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "Head magnifying glass",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Head magnifying glass — 0"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "Valves",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Valves — 0"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "Steel wire",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Steel wire — 0"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "12V coil",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "12V coil — 10"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "Resibond - Sealant",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Resibond - Sealant — 0"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "Mouse",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Mouse — 0"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "Black Adaptor",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Black Adaptor — 0"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "Autocon Single Phase Preventor",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Autocon Single Phase Preventor — 0"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "Autocon Autoswitch",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Autocon Autoswitch — 0"
  },
  {
    "cupboard": "CB7",
    "box": null,
    "name": "Terminal Box",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Terminal Box — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-27",
    "name": "TQFP soldering practice board",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "TQFP soldering practice board — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-27",
    "name": "Battery cells - Green",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Battery cells - Green — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-27",
    "name": "3 Cell Battery",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "3 Cell Battery — 1"
  },
  {
    "cupboard": "CB8",
    "box": "Box-27",
    "name": "Ampark Battery",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "Ampark Battery — 3"
  },
  {
    "cupboard": "CB8",
    "box": "Box-27",
    "name": "2 Cell Holder",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "2 Cell Holder — 1"
  },
  {
    "cupboard": "CB8",
    "box": "Box-27",
    "name": "1 Cell Holder",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "1 Cell Holder — 3"
  },
  {
    "cupboard": "CB8",
    "box": "Box-27",
    "name": "Nippo Cells",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Nippo Cells — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-27",
    "name": "USB to Box type cable",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "USB to Box type cable — 1"
  },
  {
    "cupboard": "CB8",
    "box": "Box-27",
    "name": "Battery 4 cells",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "Battery 4 cells — 2"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Battery 2 cell",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Battery 2 cell — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Multimeter",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Multimeter — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Temp-Humidity Meter",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "Temp-Humidity Meter — 4"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Clipper",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "Clipper — 1"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Digital Anemometer",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "Digital Anemometer — 1"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Socket Holder",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "Socket Holder — 1"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "DSO Probes",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "DSO Probes — 1"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Clampmeter",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Clampmeter — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Acid detector / Soil tester",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Acid detector / Soil tester — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Hacksaw",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "Hacksaw — 1"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Silicon sealant",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "Silicon sealant — 2"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Water pump plier",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Water pump plier — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "File",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "File — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Wrench",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Wrench — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Spanner",
    "qty": 7,
    "isUnclear": false,
    "originalLine": "Spanner — 7"
  },
  {
    "cupboard": "CB8",
    "box": "Box-28",
    "name": "Screwdriver",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "Screwdriver — 4"
  },
  {
    "cupboard": "CB8",
    "box": "Box-29",
    "name": "Multimeter probes",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "Multimeter probes — 2"
  },
  {
    "cupboard": "CB8",
    "box": "Box-29",
    "name": "Push spiral hand drill",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Push spiral hand drill — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-29",
    "name": "pH detector",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "pH detector — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-29",
    "name": "3 Pin Adaptor",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "3 Pin Adaptor — 1"
  },
  {
    "cupboard": "CB8",
    "box": "Box-29",
    "name": "Stripper",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Stripper — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-29",
    "name": "Jugs crimper",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "Jugs crimper — 1"
  },
  {
    "cupboard": "CB8",
    "box": "Box-30",
    "name": "Miscellaneous pcb",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "Miscellaneous pcb — 2"
  },
  {
    "cupboard": "CB8",
    "box": "Box-30",
    "name": "Computer power cord with 3 pin plug",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Computer power cord with 3 pin plug — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-30",
    "name": "Type-B Molex",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "Type-B Molex — 2"
  },
  {
    "cupboard": "CB8",
    "box": "Box-31",
    "name": "Ethernet cable",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Ethernet cable — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "Soil moisture PCB",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Soil moisture PCB — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "4G module SIMCOM bare PCB",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "4G module SIMCOM bare PCB — 0"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "Ruble PCB bare Since Advance",
    "qty": 17,
    "isUnclear": false,
    "originalLine": "Ruble PCB bare Since Advance — 17"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "Bare PCB 1 Practice PCB",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "Bare PCB 1 Practice PCB — 4"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "Bare PCB 2 ASTFC4088 Arduino Mega RAM extender",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "Bare PCB 2 ASTFC4088 Arduino Mega RAM extender — 25"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "Bare PCB 3 Meteoro Mega",
    "qty": 50,
    "isUnclear": false,
    "originalLine": "Bare PCB 3 Meteoro Mega — 50"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "Ladder PCB",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "Ladder PCB — 5"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "Bare PCB 4 Arduino Mega RAM extender",
    "qty": 7,
    "isUnclear": false,
    "originalLine": "Bare PCB 4 Arduino Mega RAM extender — 7"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "Automatch bare PCB",
    "qty": 22,
    "isUnclear": false,
    "originalLine": "Automatch bare PCB — 22"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "Bare Turo PCB For practice",
    "qty": 8,
    "isUnclear": false,
    "originalLine": "Bare Turo PCB For practice — 8"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "Bare PCB Boards",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "Bare PCB Boards — 4"
  },
  {
    "cupboard": "CB8",
    "box": "Box-32",
    "name": "Bare Bottle PCB",
    "qty": 12,
    "isUnclear": false,
    "originalLine": "Bare Bottle PCB — 12"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "26V Transformer 230V 2A",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "26V Transformer 230V 2A — 0"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "26V Transformer 230V 3A",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "26V Transformer 230V 3A — 0"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "MMBT3904",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "MMBT3904 — 0"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "1K Ohm SMD Resistor",
    "qty": 13,
    "isUnclear": false,
    "originalLine": "1K Ohm SMD Resistor — 13"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "2N3904",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "2N3904 — 3"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "4700uF Capacitor",
    "qty": 19,
    "isUnclear": false,
    "originalLine": "4700uF Capacitor — 19"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "TB6612FNG Dual Motor Stepper Driver Module",
    "qty": 80,
    "isUnclear": false,
    "originalLine": "TB6612FNG Dual Motor Stepper Driver Module — 80"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Bicolour LED Common Anode 5mm Red-Green Diffused TH",
    "qty": 90,
    "isUnclear": false,
    "originalLine": "Bicolour LED Common Anode 5mm Red-Green Diffused TH — 90"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Red LED 5mm Red Diffusion TH",
    "qty": 45,
    "isUnclear": false,
    "originalLine": "Red LED 5mm Red Diffusion TH — 45"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Ferrite Bead 75 Ohm 100MHz 3A SMD 1206",
    "qty": 6,
    "isUnclear": false,
    "originalLine": "Ferrite Bead 75 Ohm 100MHz 3A SMD 1206 — 6"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "ADS1115 ADC Module 16-bit I2C 4-Channel",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "ADS1115 ADC Module 16-bit I2C 4-Channel — 10"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Blue LED 5mm High Brightness TH",
    "qty": 90,
    "isUnclear": false,
    "originalLine": "Blue LED 5mm High Brightness TH — 90"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "ESP32-WROOM-32 WiFi BT BLE Module",
    "qty": 8,
    "isUnclear": false,
    "originalLine": "ESP32-WROOM-32 WiFi BT BLE Module — 8"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Rocker Switch SPST-6A",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "Rocker Switch SPST-6A — 5"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "MCP73844",
    "qty": 29,
    "isUnclear": false,
    "originalLine": "MCP73844 — 29"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "SS34 Diode",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "SS34 Diode — 5"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "10uF Capacitor",
    "qty": 90,
    "isUnclear": false,
    "originalLine": "10uF Capacitor — 90"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Relay S3903WTR2H4ACN0B0B",
    "qty": 25,
    "isUnclear": false,
    "originalLine": "Relay S3903WTR2H4ACN0B0B — 25"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Relay S302-T2L-3W-9V-DC-9B",
    "qty": 16,
    "isUnclear": false,
    "originalLine": "Relay S302-T2L-3W-9V-DC-9B — 16"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "8x1.2mm Plastic Command Tube",
    "qty": 16,
    "isUnclear": false,
    "originalLine": "8x1.2mm Plastic Command Tube — 16"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Relay T73 12V-10A",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "Relay T73 12V-10A — 4"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Mastech Digital Multimeter",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "Mastech Digital Multimeter — 4"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Meco TRMS Digital Clamp Meter",
    "qty": 45,
    "isUnclear": false,
    "originalLine": "Meco TRMS Digital Clamp Meter — 45"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "6-Channel Sliding Door Roller",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "6-Channel Sliding Door Roller — 2"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "MCP73844-B4 QFN",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "MCP73844-B4 QFN — 1"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "LD11117-DSH-LDO",
    "qty": 2,
    "isUnclear": false,
    "originalLine": "LD11117-DSH-LDO — 2"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "SIM A76575 4G LTE Module",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "SIM A76575 4G LTE Module — 20"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "STEP UP DOWN CONVERTOR MODULE",
    "qty": 45,
    "isUnclear": false,
    "originalLine": "STEP UP DOWN CONVERTOR MODULE — 45"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "HOPERF LoRa Module RFM95W 915S",
    "qty": 11,
    "isUnclear": false,
    "originalLine": "HOPERF LoRa Module RFM95W 915S — 11"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "74HFT29BCX Fairchild SC Buffer Non-Inverting",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "74HFT29BCX Fairchild SC Buffer Non-Inverting — 3"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "74HC4069D",
    "qty": 120,
    "isUnclear": false,
    "originalLine": "74HC4069D — 120"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "3.3K Ohm 1206 SMD Resistor",
    "qty": 96,
    "isUnclear": false,
    "originalLine": "3.3K Ohm 1206 SMD Resistor — 96"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "UFL Connector",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "UFL Connector — 5"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "1.5mm Red SMD LED",
    "qty": 145,
    "isUnclear": false,
    "originalLine": "1.5mm Red SMD LED — 145"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "HC49U 16MHz Crystal",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "HC49U 16MHz Crystal — 20"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "A2181A21GSR",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "A2181A21GSR — 20"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "100kOhm 50V Multilayer Ceramic Capacitor SMD-1206",
    "qty": 80,
    "isUnclear": false,
    "originalLine": "100kOhm 50V Multilayer Ceramic Capacitor SMD-1206 — 80"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "10uF 50V Multilayer Ceramic Cap SMD-1206",
    "qty": 145,
    "isUnclear": false,
    "originalLine": "10uF 50V Multilayer Ceramic Cap SMD-1206 — 145"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "15M Ohm Resistor N4-7-F",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "15M Ohm Resistor N4-7-F — 30"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Resistor 10K Ohm 1-4W",
    "qty": 60,
    "isUnclear": false,
    "originalLine": "Resistor 10K Ohm 1-4W — 60"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "10uF 50V SMD Electrolytic Capacitor 25V",
    "qty": 90,
    "isUnclear": false,
    "originalLine": "10uF 50V SMD Electrolytic Capacitor 25V — 90"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "LL4148 Diode MINI3-SOT-89",
    "qty": 90,
    "isUnclear": false,
    "originalLine": "LL4148 Diode MINI3-SOT-89 — 90"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "2015 5-Pin Male Connector 5.08mm Pitch 2 PIN",
    "qty": 40,
    "isUnclear": false,
    "originalLine": "2015 5-Pin Male Connector 5.08mm Pitch 2 PIN — 40"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "201 Series 4-Pin Male Connector",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "201 Series 4-Pin Male Connector — 20"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "DC Barrel Jack Male PCB Mount",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "DC Barrel Jack Male PCB Mount — 5"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "20-Pin Box Header Straight Male",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "20-Pin Box Header Straight Male — 10"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "PC817 Optocoupler",
    "qty": 18,
    "isUnclear": false,
    "originalLine": "PC817 Optocoupler — 18"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "9K Resistor 1-4W SMD 1206",
    "qty": 150,
    "isUnclear": false,
    "originalLine": "9K Resistor 1-4W SMD 1206 — 150"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "1B Ohm Resistor 1-4W SMD 1206",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "1B Ohm Resistor 1-4W SMD 1206 — 20"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Textile Push Button Switch 6x6x8mm",
    "qty": 60,
    "isUnclear": false,
    "originalLine": "Textile Push Button Switch 6x6x8mm — 60"
  },
  {
    "cupboard": "CB9",
    "box": null,
    "name": "Ruble bare PCB",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "Ruble bare PCB — 20"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "Transformer",
    "qty": 1,
    "isUnclear": false,
    "originalLine": "Transformer — 1"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "DC-DC Boost Convertor",
    "qty": 90,
    "isUnclear": false,
    "originalLine": "DC-DC Boost Convertor — 90"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "GPS Antenna",
    "qty": 28,
    "isUnclear": false,
    "originalLine": "GPS Antenna — 28"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "3 Pin Plug w Cable",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "3 Pin Plug w Cable — 5"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "LoRa Antenna",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "LoRa Antenna — 30"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "GSM Antenna",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "GSM Antenna — 30"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "Franc Bare PCB Green",
    "qty": 12,
    "isUnclear": false,
    "originalLine": "Franc Bare PCB Green — 12"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "Antenna Cable",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "Antenna Cable — 30"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "Franc Bare PCB Violet",
    "qty": 4,
    "isUnclear": false,
    "originalLine": "Franc Bare PCB Violet — 4"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "Stencil Board",
    "qty": 6,
    "isUnclear": false,
    "originalLine": "Stencil Board — 6"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "Lira Sensor",
    "qty": 12,
    "isUnclear": false,
    "originalLine": "Lira Sensor — 12"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "4700uF Capacitors",
    "qty": 7,
    "isUnclear": false,
    "originalLine": "4700uF Capacitors — 7"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "Screws",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Screws — 0"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "Euro New PCB",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Euro New PCB — 0"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "GPS Antenna (batch 2)",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "GPS Antenna (batch 2) — 0"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "270K Resistor",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "270K Resistor — 5"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "BC847 Transistor",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "BC847 Transistor — 15"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "470R Resistor",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "470R Resistor — 20"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "Diode",
    "qty": 0,
    "isUnclear": true,
    "originalLine": "Diode — 0"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "20K Resistor",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "20K Resistor — 20"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "150K Resistor",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "150K Resistor — 30"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "15K Resistor",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "15K Resistor — 30"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "27K Resistor",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "27K Resistor — 20"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "10K Resistor",
    "qty": 343,
    "isUnclear": false,
    "originalLine": "10K Resistor — 343"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "3480 Ohm IC",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "3480 Ohm IC — 15"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "100K Resistor",
    "qty": 20,
    "isUnclear": false,
    "originalLine": "100K Resistor — 20"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "100K Resistor batch2",
    "qty": 5,
    "isUnclear": false,
    "originalLine": "100K Resistor batch2 — 5"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "15K Resistor batch2",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "15K Resistor batch2 — 15"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "22K Resistor",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "22K Resistor — 15"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "180nF Capacitor",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "180nF Capacitor — 15"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "510K Resistor",
    "qty": 3,
    "isUnclear": false,
    "originalLine": "510K Resistor — 3"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "0.1uF Capacitor",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "0.1uF Capacitor — 10"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "ORC Transistor",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "ORC Transistor — 15"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "DRV8622 Driver",
    "qty": 45,
    "isUnclear": false,
    "originalLine": "DRV8622 Driver — 45"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "MCP1703 (batch2)",
    "qty": 30,
    "isUnclear": false,
    "originalLine": "MCP1703 (batch2) — 30"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "SS34 (batch2)",
    "qty": 15,
    "isUnclear": false,
    "originalLine": "SS34 (batch2) — 15"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "10uF Capacitor batch2",
    "qty": 10,
    "isUnclear": false,
    "originalLine": "10uF Capacitor batch2 — 10"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "100K Resistor batch3",
    "qty": 12,
    "isUnclear": false,
    "originalLine": "100K Resistor batch3 — 12"
  },
  {
    "cupboard": "CB9",
    "box": "Box-33",
    "name": "Auto Buck Boost Convertor",
    "qty": 100,
    "isUnclear": false,
    "originalLine": "Auto Buck Boost Convertor — 100"
  }
];

  // Sheets we'll need to read/write
  var itemMasterSheet = ss.getSheetByName('Item_Master');
  var stockSheet = ss.getSheetByName('Stock_Register');
  var boxesSheet = ss.getSheetByName('Boxes');
  var placementsSheet = ss.getSheetByName('Placements');

  var boxMap = {}; // Maps "Cupboard_Number:Box_Name" to Box_ID
  var itemMasterMap = {}; // Maps lowercased Item_Name to { Item_ID, Item_Code }
  
  var boxRows = [];
  var itemMasterRows = [];
  var stockRows = [];
  var placementRows = [];

  var newItemsCreated = 0;
  var stockEntriesCreated = 0;
  var placementsCreated = 0;
  var zeroOrUnclearItems = [];

  rawItems.forEach(function(item) {
    var cbNum = item.cupboard;
    var cbId = cbMap[cbNum];
    if (!cbId) {
      return; // Skip if cupboard not found
    }

    var boxName = item.box;
    var boxId = '';
    if (boxName) {
      var boxKey = cbNum + ':' + boxName;
      if (!boxMap[boxKey]) {
        boxId = generateId('BOX');
        boxRows.push([
          boxId,
          cbId,
          boxName,
          '', // Description
          formatDateTime()
        ]);
        boxMap[boxKey] = boxId;
      } else {
        boxId = boxMap[boxKey];
      }
    }

    // Check case-insensitive fuzzy name match in Item_Master (or cached map)
    var nameLower = item.name.toLowerCase().trim();
    var itemCode = '';
    var itemId = '';
    
    if (itemMasterMap[nameLower]) {
      itemCode = itemMasterMap[nameLower].Item_Code;
      itemId = itemMasterMap[nameLower].Item_ID;
    } else {
      // Create new Item_Master row
      itemId = generateId('ITM');
      itemCode = itemId; // set Item_Code to same as Item_ID
      
      itemMasterRows.push([
        itemId,
        item.name,
        itemCode,
        '', // HSN_Code
        'Uncategorized', // Category
        'pcs', // Unit
        0, // Min_Stock
        0, // Max_Stock
        0, // Reorder_Level
        cbNum + (boxName ? ' - ' + boxName : ''), // Location
        '', // Image_URL
        'Imported during initial setup', // Description
        'Active', // Status
        formatDateTime(),
        formatDateTime()
      ]);
      
      itemMasterMap[nameLower] = { Item_ID: itemId, Item_Code: itemCode };
      newItemsCreated++;
    }

    // Write Stock_Register inward entry
    var entryId = generateId('ENT');
    var locationLabel = cbNum + (boxName ? ' - ' + boxName : '');
    
    var stockRow = [
      entryId,
      formatDateTime(),
      item.name,
      itemCode,
      '', // HSN_Code
      locationLabel,
      'Inward', // Transaction_Type
      item.qty, // Inward_Qty
      'INITIAL-IMPORT', // Invoice_No
      formatDateTime().split(' ')[0], // Invoice_Date (DD-MM-YYYY)
      '', // GRN_No
      'Initial Stock Import', // Vendor_Name
      0, // Price_Per_Item
      0, // Discount_Pct
      0, // Taxable_Value
      0, // GST_Rate
      0, // CGST_Amt
      0, // SGST_Amt
      0, // Total_Invoice_Value
      0, // Outward_Qty
      '', // Issued_To
      '', // SO_Invoice_No
      '', // SO_Invoice_Date
      0, // Out_Price_Per_Item
      0, // Out_Taxable_Value
      0, // Out_GST_Rate
      0, // Out_CGST_Amt
      0, // Out_SGST_Amt
      0, // Out_Total_Invoice_Value
      item.qty, // Balance_Qty
      'Admin', // Employee_Name
      '', // Received_By
      '' // Remarks
    ];
    stockRows.push(stockRow);
    stockEntriesCreated++;

    // Create Placements row
    var placementId = generateId('PLC');
    placementRows.push([
      placementId,
      itemCode,
      cbId,
      boxId || '',
      item.qty,
      formatDateTime()
    ]);
    placementsCreated++;

    if (item.isUnclear) {
      zeroOrUnclearItems.push({
        cupboard: cbNum,
        box: boxName || 'Direct',
        name: item.name,
        originalLine: item.originalLine
      });
    }
  });

  // Bulk write to sheets
  if (boxRows.length > 0) {
    boxesSheet.getRange(2, 1, boxRows.length, boxRows[0].length).setValues(boxRows);
    var extraRows = boxesSheet.getLastRow() - (1 + boxRows.length);
    if (extraRows > 0) {
      boxesSheet.deleteRows(2 + boxRows.length, extraRows);
    }
  }
  if (itemMasterRows.length > 0) {
    itemMasterSheet.getRange(2, 1, itemMasterRows.length, itemMasterRows[0].length).setValues(itemMasterRows);
    var extraRows = itemMasterSheet.getLastRow() - (1 + itemMasterRows.length);
    if (extraRows > 0) {
      itemMasterSheet.deleteRows(2 + itemMasterRows.length, extraRows);
    }
  }
  if (stockRows.length > 0) {
    stockSheet.getRange(2, 1, stockRows.length, stockRows[0].length).setValues(stockRows);
    var extraRows = stockSheet.getLastRow() - (1 + stockRows.length);
    if (extraRows > 0) {
      stockSheet.deleteRows(2 + stockRows.length, extraRows);
    }
  }
  if (placementRows.length > 0) {
    placementsSheet.getRange(2, 1, placementRows.length, placementRows[0].length).setValues(placementRows);
    var extraRows = placementsSheet.getLastRow() - (1 + placementRows.length);
    if (extraRows > 0) {
      placementsSheet.deleteRows(2 + placementRows.length, extraRows);
    }
  }

  return {
    success: true,
    wiped: wipedSummary,
    cupboardsCreatedCount: 13,
    newItemsCreatedCount: newItemsCreated,
    stockEntriesCreatedCount: stockEntriesCreated,
    placementsCreatedCount: placementsCreated,
    zeroOrUnclearItems: zeroOrUnclearItems
  };
}
