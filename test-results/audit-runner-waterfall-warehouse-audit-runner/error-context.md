# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audit-runner.spec.ts >> waterfall warehouse audit runner
- Location: scripts\audit-runner.spec.ts:10:5

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for locator('table tbody tr').locator('button:has-text("Edit")')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - generic [ref=e4]:
        - img [ref=e6]
        - generic [ref=e10]: Waterfall Warehouse
      - navigation [ref=e14]:
        - link "Dashboard" [ref=e15] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e16]
          - generic [ref=e21]: Dashboard
        - link "Stock Register" [ref=e22] [cursor=pointer]:
          - /url: /inventory
          - img [ref=e23]
          - generic [ref=e27]: Stock Register
        - link "Invoices" [ref=e28] [cursor=pointer]:
          - /url: /invoices
          - img [ref=e29]
          - generic [ref=e32]: Invoices
        - link "Storage Map" [ref=e33] [cursor=pointer]:
          - /url: /inventory-map
          - img [ref=e34]
          - generic [ref=e36]: Storage Map
        - link "Item Master" [ref=e37] [cursor=pointer]:
          - /url: /item-master
          - img [ref=e38]
          - generic [ref=e41]: Item Master
          - img [ref=e42]
        - link "Vendors" [ref=e44] [cursor=pointer]:
          - /url: /vendors
          - img [ref=e45]
          - generic [ref=e49]: Vendors
        - link "GST Summary" [ref=e50] [cursor=pointer]:
          - /url: /gst-summary
          - img [ref=e51]
          - generic [ref=e53]: GST Summary
        - link "Notice Board" [ref=e54] [cursor=pointer]:
          - /url: /notice-board
          - img [ref=e55]
          - generic [ref=e58]: Notice Board
        - link "Tasks" [ref=e59] [cursor=pointer]:
          - /url: /tasks
          - img [ref=e60]
          - generic [ref=e63]: Tasks
        - link "Users" [ref=e64] [cursor=pointer]:
          - /url: /users
          - img [ref=e65]
          - generic [ref=e70]: Users
        - link "Roles" [ref=e71] [cursor=pointer]:
          - /url: /roles
          - img [ref=e72]
          - generic [ref=e75]: Roles
        - link "Registers" [ref=e76] [cursor=pointer]:
          - /url: /registers
          - img [ref=e77]
          - generic [ref=e80]: Registers
        - link "Activity Log" [ref=e81] [cursor=pointer]:
          - /url: /activity-log
          - img [ref=e82]
          - generic [ref=e86]: Activity Log
        - link "Recycle Bin" [ref=e87] [cursor=pointer]:
          - /url: /recycle-bin
          - img [ref=e88]
          - generic [ref=e91]: Recycle Bin
        - link "Settings" [ref=e92] [cursor=pointer]:
          - /url: /settings
          - img [ref=e93]
          - generic [ref=e96]: Settings
      - generic [ref=e98]:
        - generic [ref=e100]: A
        - generic [ref=e101]:
          - paragraph [ref=e102]: Admin
          - paragraph [ref=e103]: Super Admin
        - button "Logout" [ref=e104] [cursor=pointer]:
          - img
    - generic [ref=e105]:
      - banner [ref=e106]:
        - generic [ref=e107]:
          - button [ref=e108] [cursor=pointer]:
            - img
          - button "A Admin" [ref=e109] [cursor=pointer]:
            - generic [ref=e111]: A
            - generic [ref=e112]: Admin
      - main [ref=e113]:
        - generic [ref=e114]:
          - generic [ref=e115]:
            - generic [ref=e116]:
              - heading "Item Master" [level=1] [ref=e117]
              - paragraph [ref=e118]: Master catalogue of all inventory items with reorder levels.Demo
            - generic [ref=e119]:
              - button [ref=e120] [cursor=pointer]:
                - img
              - button "Pending Review (2)" [ref=e121] [cursor=pointer]:
                - img
                - text: Pending Review (2)
              - button "Add to Catalog" [ref=e122] [cursor=pointer]:
                - img
                - text: Add to Catalog
          - generic [ref=e123]:
            - generic [ref=e125] [cursor=pointer]:
              - img [ref=e126]
              - generic [ref=e129]:
                - paragraph [ref=e130]: "5"
                - paragraph [ref=e131]: Total Items
            - generic [ref=e133] [cursor=pointer]:
              - img [ref=e134]
              - generic [ref=e138]:
                - paragraph [ref=e139]: "5"
                - paragraph [ref=e140]: Categories
            - generic [ref=e142] [cursor=pointer]:
              - img [ref=e143]
              - generic [ref=e146]:
                - paragraph [ref=e147]: "5"
                - paragraph [ref=e148]: Active
            - generic [ref=e150] [cursor=pointer]:
              - img [ref=e151]
              - generic [ref=e154]:
                - paragraph [ref=e155]: "5"
                - paragraph [ref=e156]: Low Reorder
          - generic [ref=e157]:
            - button "5 No Location" [ref=e158] [cursor=pointer]:
              - img [ref=e159]
              - generic [ref=e162]:
                - paragraph [ref=e163]: "5"
                - paragraph [ref=e164]: No Location
            - button "1 Incomplete Info" [ref=e165] [cursor=pointer]:
              - img [ref=e166]
              - generic [ref=e168]:
                - paragraph [ref=e169]: "1"
                - paragraph [ref=e170]: Incomplete Info
            - button "1 No Invoice Attached" [ref=e171] [cursor=pointer]:
              - img [ref=e172]
              - generic [ref=e174]:
                - paragraph [ref=e175]: "1"
                - paragraph [ref=e176]: No Invoice Attached
          - generic [ref=e177]:
            - generic [ref=e180]:
              - img [ref=e181]
              - textbox "Search items…" [active] [ref=e184]: Blank-Max-Stock-Item
            - table [ref=e187]:
              - rowgroup [ref=e188]:
                - row "Item Name Code HSN Category Unit Min Max Reorder Location Edit" [ref=e189]:
                  - columnheader "Item Name" [ref=e190]
                  - columnheader "Code" [ref=e191]
                  - columnheader "HSN" [ref=e192]
                  - columnheader "Category" [ref=e193]
                  - columnheader "Unit" [ref=e194]
                  - columnheader "Min" [ref=e195]
                  - columnheader "Max" [ref=e196]
                  - columnheader "Reorder" [ref=e197]
                  - columnheader "Location" [ref=e198]
                  - columnheader "Edit" [ref=e199]
              - rowgroup [ref=e200]:
                - row "Blank-Max-Stock-Item BLANK-MAX-01 Other pcs 5 ∞ 10 Default" [ref=e201]:
                  - cell "Blank-Max-Stock-Item" [ref=e202]:
                    - button "Blank-Max-Stock-Item" [ref=e203] [cursor=pointer]
                  - cell "BLANK-MAX-01" [ref=e204]
                  - cell [ref=e205]
                  - cell "Other" [ref=e206]:
                    - generic [ref=e207]: Other
                  - cell "pcs" [ref=e208]
                  - cell "5" [ref=e209]
                  - cell "∞" [ref=e210]
                  - cell "10" [ref=e211]
                  - cell "Default" [ref=e212]
                  - cell [ref=e213]:
                    - button [ref=e214] [cursor=pointer]:
                      - img
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e220] [cursor=pointer]:
    - img [ref=e221]
  - alert [ref=e224]
```

# Test source

```ts
  77  |         else if (tab === 'Boxes') data = mockBoxes;
  78  |         else if (tab === 'Placements') data = mockPlacements;
  79  |         else if (tab === 'Users') data = [];
  80  |         else if (tab === 'Vendors') data = [];
  81  |         
  82  |         await route.fulfill({
  83  |           status: 200,
  84  |           contentType: 'application/json',
  85  |           headers: {
  86  |             'Access-Control-Allow-Origin': '*'
  87  |           },
  88  |           body: JSON.stringify({ success: true, data })
  89  |         });
  90  |       } else if (method === 'POST') {
  91  |         const bodyText = route.request().postData() || '';
  92  |         const bodyObj = JSON.parse(bodyText);
  93  |         const tab = bodyObj.tab;
  94  |         const rowData = bodyObj.data;
  95  |         
  96  |         if (tab === 'Item_Master') {
  97  |           const idx = mockItemMaster.findIndex(i => i.Item_ID === rowData.Item_ID);
  98  |           if (idx >= 0) mockItemMaster[idx] = rowData;
  99  |           else mockItemMaster.push(rowData);
  100 |         } else if (tab === 'Stock_Register') {
  101 |           const idx = mockEntries.findIndex(e => e.Entry_ID === rowData.Entry_ID);
  102 |           if (idx >= 0) mockEntries[idx] = rowData;
  103 |           else mockEntries.push(rowData);
  104 |         } else if (tab === 'Cupboards') {
  105 |           const idx = mockCupboards.findIndex(c => c.Cupboard_ID === rowData.Cupboard_ID);
  106 |           if (idx >= 0) mockCupboards[idx] = rowData;
  107 |           else mockCupboards.push(rowData);
  108 |         } else if (tab === 'Boxes') {
  109 |           const idx = mockBoxes.findIndex(b => b.Box_ID === rowData.Box_ID);
  110 |           if (idx >= 0) mockBoxes[idx] = rowData;
  111 |           else mockBoxes.push(rowData);
  112 |         } else if (tab === 'Placements') {
  113 |           const idx = mockPlacements.findIndex(p => p.Placement_ID === rowData.Placement_ID);
  114 |           if (idx >= 0) mockPlacements[idx] = rowData;
  115 |           else mockPlacements.push(rowData);
  116 |         }
  117 |         
  118 |         await route.fulfill({
  119 |           status: 200,
  120 |           contentType: 'application/json',
  121 |           headers: {
  122 |             'Access-Control-Allow-Origin': '*'
  123 |           },
  124 |           body: JSON.stringify({ success: true, message: 'Success' })
  125 |         });
  126 |       }
  127 |     } catch (err: any) {
  128 |       await route.fulfill({
  129 |         status: 500,
  130 |         headers: {
  131 |           'Access-Control-Allow-Origin': '*'
  132 |         },
  133 |         body: JSON.stringify({ success: false, error: err.message })
  134 |       });
  135 |     }
  136 |   });
  137 | 
  138 |   // --- QUESTION 40 ---
  139 |   console.log('Executing Q40...');
  140 |   await page.goto('http://localhost:9002/item-master');
  141 |   await page.waitForTimeout(3000); // Give Next.js compilation time
  142 |   await page.click('button:has-text("Add to Catalog"):has(svg)', { force: true });
  143 |   await page.waitForTimeout(1000);
  144 |   const modalDescription = await page.textContent('role=dialog >> text=Enter details to catalog a new item');
  145 |   console.log(`Q40 Observed Description: "${modalDescription?.trim()}"`);
  146 |   await page.click('role=dialog >> button:has-text("Cancel")', { force: true });
  147 |   await page.waitForTimeout(1500); // Give time for backdrop fade-out
  148 | 
  149 |   // --- QUESTION 41 ---
  150 |   console.log('Executing Q41...');
  151 |   await page.click('button:has-text("Add to Catalog"):has(svg)', { force: true });
  152 |   await page.waitForTimeout(1000);
  153 |   const testItemName = `Blank-Max-Stock-Item`;
  154 |   const testItemCode = `BLANK-MAX-01`;
  155 |   await page.fill('role=dialog >> input >> nth=0', testItemName);
  156 |   await page.fill('role=dialog >> input >> nth=1', testItemCode);
  157 |   await page.fill('role=dialog >> input >> nth=4', '5');  // Min Stock
  158 |   await page.fill('role=dialog >> input >> nth=5', '');   // Max left blank
  159 |   await page.fill('role=dialog >> input >> nth=6', '10');  // Reorder Level
  160 |   await page.click('role=dialog >> button:has-text("Add to Catalog")', { force: true });
  161 |   await page.waitForTimeout(2000);
  162 |   
  163 |   await page.fill('input[placeholder="Search items…"]', testItemName);
  164 |   await page.waitForTimeout(1000);
  165 |   // Column 7 is Max stock
  166 |   const tableMaxStockText = await page.locator('table tbody tr >> td:nth-child(7)').first().textContent();
  167 |   console.log(`Q41 Observed Max Stock in table: "${tableMaxStockText?.trim()}"`);
  168 |   console.log('Q41 Note: Navigation to the Item details page is BROKEN due to an infinite re-render loop on /item-master/[itemId].');
  169 | 
  170 |   // --- QUESTION 42 ---
  171 |   console.log('Executing Q42...');
  172 |   // Stay on current page, clear search first
  173 |   await page.fill('input[placeholder="Search items…"]', '');
  174 |   await page.waitForTimeout(500);
  175 |   await page.fill('input[placeholder="Search items…"]', testItemName);
  176 |   await page.waitForTimeout(1000);
> 177 |   await page.click('table tbody tr >> button:has-text("Edit")', { force: true });
      |              ^ Error: page.click: Test timeout of 120000ms exceeded.
  178 |   await page.waitForTimeout(1000);
  179 |   await page.fill('role=dialog >> input >> nth=4', '-15'); // Negative Min Stock (nth=4)
  180 |   await page.click('role=dialog >> button:has-text("Update Catalog")', { force: true });
  181 |   await page.waitForTimeout(1500);
  182 |   const isDialogClosedQ42 = !(await page.isVisible('role=dialog'));
  183 |   console.log(`Q42 Succeeded in saving negative Min Stock: ${isDialogClosedQ42 ? 'Yes (Allows negative values)' : 'No (Blocked)'}`);
  184 |   if (isDialogClosedQ42) {
  185 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'q42-negative-stock.png') });
  186 |   }
  187 | 
  188 |   // --- QUESTION 43 ---
  189 |   console.log('Executing Q43...');
  190 |   if (await page.isVisible('role=dialog')) {
  191 |     await page.click('role=dialog >> button:has-text("Cancel")', { force: true });
  192 |     await page.waitForTimeout(1000);
  193 |   }
  194 |   await page.click('button:has-text("Add to Catalog"):has(svg)', { force: true });
  195 |   await page.waitForTimeout(1000);
  196 |   await page.fill('role=dialog >> input >> nth=0', `${testItemName} `); // Trailing space near-identical name
  197 |   await page.fill('role=dialog >> input >> nth=1', 'NEAR-ID-01');
  198 |   await page.click('role=dialog >> button:has-text("Add to Catalog")', { force: true });
  199 |   await page.waitForTimeout(1500);
  200 |   const isDialogClosedQ43 = !(await page.isVisible('role=dialog'));
  201 |   console.log(`Q43 Succeeded in saving near-identical name (trailing space): ${isDialogClosedQ43 ? 'Yes (No deduplication)' : 'No (Blocked)'}`);
  202 |   if (isDialogClosedQ43) {
  203 |     await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'q43-near-identical.png') });
  204 |   }
  205 |   if (await page.isVisible('role=dialog')) {
  206 |     await page.click('role=dialog >> button:has-text("Cancel")', { force: true });
  207 |     await page.waitForTimeout(1000);
  208 |   }
  209 | 
  210 |   // --- QUESTION 44 ---
  211 |   console.log('Executing Q44...');
  212 |   await page.click('button:has-text("Add to Catalog"):has(svg)', { force: true });
  213 |   await page.waitForTimeout(1000);
  214 |   await page.fill('role=dialog >> input >> nth=0', testItemName); // Type exact name
  215 |   await page.waitForTimeout(1500);
  216 |   const isSuggestionsVisible = await page.isVisible('role=dialog >> text=Code:');
  217 |   console.log(`Q44 Autocomplete suggestions visible for exact name: ${isSuggestionsVisible}`);
  218 |   if (isSuggestionsVisible) {
  219 |     await page.click('role=dialog >> button:has-text("Code:")', { force: true });
  220 |     await page.waitForTimeout(1000);
  221 |     const isModalOpenQ44 = await page.isVisible('role=dialog');
  222 |     console.log(`Q44 Modal still open (blocked catalog creation): ${isModalOpenQ44}`);
  223 |   }
  224 |   if (await page.isVisible('role=dialog')) {
  225 |     await page.click('role=dialog >> button:has-text("Cancel")', { force: true });
  226 |     await page.waitForTimeout(1000);
  227 |   }
  228 | 
  229 |   // --- QUESTION 45 ---
  230 |   console.log('Executing Q45...');
  231 |   const noLocationCount = await page.textContent('button:has-text("No Location") >> p');
  232 |   const incompleteCount = await page.textContent('button:has-text("Incomplete Info") >> p');
  233 |   const noInvoiceCount = await page.textContent('button:has-text("No Invoice Attached") >> p');
  234 |   console.log(`Q45 Counts - No Location: ${noLocationCount?.trim()}, Incomplete: ${incompleteCount?.trim()}, No Invoice: ${noInvoiceCount?.trim()}`);
  235 | 
  236 |   // --- QUESTION 46 ---
  237 |   console.log('Executing Q46...');
  238 |   await page.click('button:has-text("No Invoice Attached")', { force: true });
  239 |   await page.waitForTimeout(1000);
  240 |   const isInvoiceCardVisible = await page.isVisible('text=Inward entries with no Invoice No');
  241 |   const firstRowItemName = await page.locator('table tbody tr >> td:nth-child(2)').first().textContent();
  242 |   console.log(`Q46 Invoice-less list visible: ${isInvoiceCardVisible}, First catalog table item name while card clicked: "${firstRowItemName?.trim()}"`);
  243 |   await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'q46-no-invoice-filter.png') });
  244 |   await page.click('button:has-text("No Invoice Attached")', { force: true });
  245 |   await page.waitForTimeout(1000);
  246 | 
  247 |   // --- QUESTION 47 ---
  248 |   console.log('Executing Q47...');
  249 |   // Clear search first
  250 |   await page.fill('input[placeholder="Search items…"]', '');
  251 |   await page.waitForTimeout(500);
  252 |   await page.fill('input[placeholder="Search items…"]', 'Pending Cable Ext');
  253 |   await page.waitForTimeout(1000);
  254 |   const searchResultsCount = await page.locator('table tbody tr').count();
  255 |   console.log(`Q47 Pending Review item found in active catalog list: ${searchResultsCount > 0 ? 'Yes (Not hidden)' : 'No (Hidden successfully)'}`);
  256 | 
  257 |   // --- QUESTION 48 & 49 & 50 ---
  258 |   console.log('Executing Q48, Q49, Q50...');
  259 |   await page.click('button:has-text("Pending Review")', { force: true });
  260 |   await page.waitForTimeout(1000);
  261 |   
  262 |   const initialPendingBadge = await page.textContent('role=dialog >> text=Pending Item Queue >> xpath=.. >> span');
  263 |   console.log(`Q49 Initial Queue count: "${initialPendingBadge?.trim()}"`);
  264 | 
  265 |   // Navigating Next/Prev
  266 |   const firstItemNameInQueue = await page.textContent('role=dialog >> h3');
  267 |   console.log(`Q50 First item in queue: "${firstItemNameInQueue?.trim()}"`);
  268 |   await page.click('role=dialog >> button:has-text("Next")', { force: true });
  269 |   await page.waitForTimeout(1000);
  270 |   const secondItemNameInQueue = await page.textContent('role=dialog >> h3');
  271 |   console.log(`Q50 Second item in queue after Next: "${secondItemNameInQueue?.trim()}"`);
  272 |   await page.click('role=dialog >> button:has-text("Prev")', { force: true });
  273 |   await page.waitForTimeout(1000);
  274 | 
  275 |   // Map to Selected Match
  276 |   await page.click('role=dialog >> button:has-text("Map to Selected Match")', { force: true });
  277 |   await page.waitForTimeout(1000);
```