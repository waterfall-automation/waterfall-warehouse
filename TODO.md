# Project Todo & Known Limitations

## Known Limitations / Technical Debt

### 1. Inward Modal Non-Atomic Sequential Save (Desync Risk)
- **Status**: **Implemented (Pending Apps Script Redeploy)**
- **Description**: Re-architected the save pipeline in `inward-modal.tsx` to build a single batch transactional payload and call `saveInwardBatch` on the backend. Both the Apps Script backend and the local Next.js JSON handler run all operations atomically within a single transactional execution (with locking on Apps Script).
- **Risk**: Resolved. Mid-loop failures leaving partial data are eliminated.


### 2. Duplicate Invoice_No Handling and Silent Data Loss (Q77, Q78, Q79)
- **Status**: **Warning/Display Phase Complete (Merge/Management UI Deferred)**
- **Description**: The Invoices page previously grouped records by `Invoice_No` using a Map, silently discarding earlier metadata. This has been resolved by keeping all raw rows visible and rendering a `⚠️ Duplicate` badge. Furthermore, submitting a duplicate `Invoice_No` in `inward-modal.tsx` now prompts the user with an explicit warning dialog.
- **Remaining Deferred Work**: Re-engineer the backend sheets route or UI controls to support merging, renaming, or deleting duplicate invoices cleanly without leaving orphaned records.
