# Waterfall Warehouse — Full System Audit Questions

Purpose: hand this to Antigravity (or Claude Code) as a structured audit pass.
For each question, the agent should actually check the code/behavior — not guess —
and report: **Working / Broken / Missing / Not Applicable**, with a one-line reason.

Suggested approach: run this in batches of 15-20 questions per prompt, not all at once,
so answers stay accurate and reviewable.

---

## A. Inward Entry (Stock Register — With/Without Invoice)

1. Does the Inward modal correctly distinguish "With Invoice" vs "Without Invoice" flows?
2. If a user picks "With Invoice" but leaves the invoice number blank, what happens on submit?
3. Does typing an item name that closely (but not exactly) matches an existing item show it as a suggestion?
4. If a user ignores the suggestion and types a brand-new name anyway, does it correctly go to Pending Review?
5. Can two people submit an Inward entry for the exact same new item name at nearly the same time — does one end up orphaned or duplicated?
6. Does pasting a multi-line Excel column into Item Name create the correct number of new rows?
7. Does pasting a 4-column Excel block (Item, Qty, Price, GST) into one field correctly distribute across all 4 columns?
8. If you paste a column that's longer than the current table, does it correctly append new rows only for the overflow?
9. If you paste into a row that already has data, does it overwrite that row's fields, or accidentally duplicate the row?
10. Is Employee Name shared once for the entire submission, or does it still ask per-row anywhere?
11. Is Date shared once for the entire submission?
12. Does the date picker support both calendar-click AND manual typing?
13. If the same employee name is typed with different casing ("Ramesh" vs "ramesh"), does it get treated as the same person or two different ones?
14. Can a location be assigned per-row during Inward entry, or only afterward via Storage Map?
15. If a location is assigned during Inward and the cupboard doesn't exist yet, can it be created inline without losing the rest of the form?
16. Does the "Remaining to place" counter update live and correctly when splitting one item across multiple locations?
17. What happens if the user tries to place MORE than the row's quantity across locations — is it blocked with a clear message?
18. What happens if a required field (Qty, Item Name) is left blank — does it turn red and block submission, or silently fail?
19. If the browser crashes or the tab is closed mid-entry with unsaved rows, is there any recovery, or is it just lost (acceptable, but confirm expected)?
20. Does clicking outside the modal with unsaved data correctly prevent it from closing?

## B. Outward Entry

21. Does the Outward picker only show items that currently have stock in at least one location?
22. If an item has zero placed stock anywhere, does it correctly NOT appear in the Outward picker (even if Item Master total balance is technically positive but unplaced)?
23. Does the search bar in the Outward picker actually filter correctly by partial name match?
24. When selecting multiple locations for the same item, does the qty stepper (+/-) correctly cap at each location's OWN available quantity (not the item's total)?
25. Can you type a quantity directly instead of only using +/- buttons?
26. Does the cart/side panel correctly show a running list of all selected item+location+qty combinations?
27. Can you remove a single line from the cart without resetting the whole form?
28. On submit, is exactly one Stock_Register Outward entry created per item (aggregated across locations), or one per location (confirm which — and is that the intended design)?
29. After submitting, do the Placements at EACH selected location decrease independently by the correct amount?
30. Does the item's computed total balance correctly reflect the outward transaction afterward?
31. Is "Issued To" a required field — does it validate properly?
32. Can Outward be submitted with zero items selected — is that blocked?

## C. Return Flow

33. Does the "Return" action only appear on Outward-type entries (not Inward)?
34. Is the return quantity capped at the originally issued quantity (can't return more than was taken out)?
35. Does submitting a return correctly increase the available balance back?
36. Does the return show as its own distinct entry type (RET badge) in the ledger, not overwrite the original Outward entry?
37. Does a Return correctly restore quantity to a SPECIFIC location (the one it was taken from), or just to a generic pool?
38. If the original outward pulled from 2 different locations, can a partial return correctly specify which location it's going back to?
39. Is there a reason/notes field for why something was returned?

## D. Item Master

40. Does "Add to Catalog" (or whatever it's now labeled) clearly NOT create stock quantity, only a catalog record?
41. Does leaving Max Stock blank correctly show ∞ everywhere it's displayed (table, detail page, forms)?
42. Do Min/Max/Reorder fields accept only valid numbers (no negative numbers, no text)?
43. Does the autocomplete-with-duplicate-block actually prevent creating a second item with a near-identical name?
44. Does clicking a suggested existing item correctly show the "already exists" message and block creation?
45. Do the "No Location" / "Incomplete Info" / "No Invoice Attached" call-out cards show accurate live counts?
46. Clicking each call-out card — does it correctly filter the table to ONLY matching items?
47. Does the Pending Review queue correctly hide new unmatched items from the normal catalog/autocomplete until approved?
48. In Pending Review, does "Map to Selected Match" correctly rewrite the item's existing Stock_Register/Placement rows to the matched item's code?
49. Does the Pending Review badge count update immediately after approving/rejecting one item (not stale)?
50. Can you navigate Next/Prev through multiple pending items without losing your place?
51. Does clicking an item name open the item detail page correctly?
52. Does hovering an item name show the lightweight tooltip without lag?
53. Does the item detail page's "Similar Items" section show genuinely relevant items, not random ones?
54. Does editing an existing item's Category/Unit/Location actually save and persist after refresh?
55. Does deleting an item move it to Recycle Bin, and does restoring it bring it back correctly (not silently vanish on next refresh)?

## E. Storage Map

56. Does "Add Container" let you pick Cupboard, Drawer, or a fully custom type name?
57. Can items be placed DIRECTLY in a container without being forced into a box first?
58. Can boxes be created inside a container, and items placed inside those boxes?
59. Does the LocationPicker's folder-browser navigation (drill in/out) work smoothly with a back button at every level?
60. After selecting a location, does it correctly collapse into a compact breadcrumb label (e.g. "C-01 / Box A")?
61. Clicking that breadcrumb label — does it reopen the picker to change the location?
62. Does the "Similar items in..." hint show accurate locations AND quantities, and is it correctly non-clickable/view-only?
63. Does the Relocate action correctly pre-fill the item's CURRENT locations as starting rows?
64. After relocating, does the OLD location's quantity decrease and the NEW location's quantity increase by the correct amount (not duplicated, not lost)?
65. Does the "Unassigned Items" panel correctly show only items with balance > 0 and zero/partial placement?
66. Does the unassigned qty shown match (Total Balance − Sum of all Placements) exactly?
67. Can you edit a Box's details (name, description) after creation?
68. Can you edit a Cupboard's details after creation?
69. Does deleting a Cupboard/Box show a confirmation warning stating how many items will be affected?
70. If you delete a Cupboard that still has items placed in it, what actually happens to those Placement records — orphaned, moved to unassigned, or blocked from deleting?
71. Does the Add Item/Add Box option exist consistently everywhere a user might expect it (not just one specific screen)?
72. Is the box/cupboard info card visible in front of other UI elements (not clipped/hidden behind anything)?

## F. Invoices Page

73. Does the Invoices list show accurate item counts and total values per invoice?
74. Clicking an invoice — does it show ALL Stock_Register rows actually tied to that Invoice_No?
75. Clicking an item within an invoice's detail view — does the popup show correct image/info/logs for that specific item?
76. Does the "?invoice=" deep link correctly auto-open the right invoice when navigated to directly?
77. Are invoices with the same Invoice_No but entered across multiple separate Inward sessions correctly grouped together, or duplicated as separate invoice records?
78. Is there a way to identify/handle a genuinely duplicate/mistaken invoice entry (e.g. accidentally submitted invoice twice)?
79. If someone needs to DELETE an entire invoice by mistake, is that possible, and does it correctly reverse/remove all associated Stock_Register and Placement rows, or leave orphaned data?

## G. Vendors

80. Does "Items Purchased" per vendor show accurate items and quantities?
81. Clicking a purchased item WITH an invoice — does it navigate to that invoice correctly?
82. Clicking a purchased item WITHOUT an invoice — does it correctly do nothing (no dead click, no error)?
83. Clicking a vendor name anywhere else in the app (Stock Register, Invoices) — does it open the same consistent vendor profile popup?
84. Can a Vendor be edited after creation (contact info, GSTIN, etc.) and does it persist?
85. Does deleting a Vendor move it to Recycle Bin, and does restoring it correctly bring it back into the live Vendors list (not silently vanish)?

## H. GST Summary

86. Are the GST totals (CGST/SGST/Taxable Value) calculated only from Inward transactions, or does anything incorrectly include Outward too?
87. Does the GST trend graph (This Month/Year/Custom) show accurate historical data?
88. Does switching between graph time ranges actually update the data, not just the label?
89. Are GST slab groupings (28%/18%/12%/5%/0%) calculated correctly against real entries?

## I. Users

90. Does the unverified-users banner accurately show ONLY users with Verified ≠ YES?
91. Does clicking "Approve" in that banner correctly set Verified to YES and persist after refresh?
92. Does clicking "Delete" in that banner move the user to Recycle Bin correctly?
93. Are unverified users genuinely sorted to appear FIRST in the main user list, every time?
94. Does each user's profile page correctly show their personal details (name, email, dept, phone)?
95. Does the permissions UI correctly show page-level toggles first, with granular options greyed out until the page toggle is on?
96. Does saving a permission change actually persist to the backend (not just local state)?
97. Does the per-user Activity Log tab show genuinely relevant actions (their own actions), not everyone's?
98. Does the per-user Ledger tab correctly show transactions where they were the actor OR recipient?
99. Does the per-user Tasks tab correctly show only tasks assigned to them?
100. If a user is deleted then restored, do all their historical activity/ledger/task references still correctly link to them (not broken by ID mismatch)?

## J. Roles & Permissions

101. Can a new Role be created with a custom name and description?
102. Do permission toggles on a Role actually restrict/allow the corresponding UI elements for users with that role (or is this just data storage with no real enforcement yet — important to know either way)?
103. Can a Role be deleted, and what happens to Users currently assigned that role?

## K. Notice Board & Tasks

104. Does tagging a user in a new notice correctly create a Tasks row for them?
105. Does the Tasks page correctly filter "Assigned to Me" vs "All Tasks"?
106. Does marking a task complete correctly update its status and persist?
107. If a notice is deleted, do the Tasks it generated remain intact (or should they also be removed — worth deciding intentionally either way)?
108. Does a notice's priority level (urgent/important/info) display distinctly and correctly?
109. Do expired notices (past their expiry date) still show, or are they correctly hidden/archived?

## L. Recycle Bin

110. Does the Recycle Bin show deleted items from ALL entity types (Stock entries, Item Master, Cupboards, Boxes, Users, Vendors) — not just a subset?
111. Does restoring EACH entity type correctly write back to its real Sheet tab (not just local state that vanishes on refresh)?
112. Does "Empty Bin" actually permanently delete everything, with a clear warning before doing so?
113. Is there a way to see WHO deleted something and WHEN?
114. Can a single item be restored without needing to empty/restore everything at once?

## M. Activity Log

115. Does the Activity Log capture ALL major actions across the app (not just some) — Inward, Outward, Return, Placement changes, Box/Cupboard creation/deletion, User changes, Task updates?
116. Do the action badges use distinct, sensible colors that make scanning the log easy?
117. Does the search/filter on Activity Log actually work across all logged action types?
118. Can you filter Activity Log by a specific user, date range, or action type?
119. Is there a CSV export, and does it export the currently filtered view or always everything?

## N. Dashboard

120. Do the dashboard stat cards (Total Items, Low Stock, Out of Stock, Today's Entries) show numbers that match reality (spot-check against Item Master/Stock Register directly)?
121. Clicking each dashboard card — does it navigate to the correctly filtered destination?
122. Does the "recent activity" section on dashboard show genuinely recent, real transactions?
123. Is there anything on the dashboard still showing hardcoded/demo data instead of live data?

## O. Cross-Cutting / Universal Behavior

124. Is the click-flash (blue highlight on click) applied consistently across ALL major clickable elements, or only some pages?
125. Do all "similar" buttons across different pages (e.g. all "Add X" buttons, all "Delete" buttons, all "Edit" buttons) look and behave consistently, or are some styled/positioned differently without reason?
126. Is there any page where a user can currently get stuck with no visible way back or forward (true dead end)?
127. Does browser back/forward button work correctly and predictably across all pages?
128. Does the URL address bar accurately reflect the current page/state at all times (not stuck on a stale route)?
129. Are all modals/dialogs consistent in their "click outside with unsaved changes" protection, or does this only work on some?
130. Is the global loading state (route transitions) showing consistently across every page, or missing on some?
131. Are there any remaining `.toLowerCase()`/`.trim()` crashes lurking in less-tested pages (Roles, Settings, Registers, Notice Board)?
132. Does the app behave correctly when the backend is genuinely unreachable (shows demo data + toast, doesn't crash)?
133. Does the app recover automatically once the backend becomes reachable again (without requiring a manual refresh)?
134. Is there any place where a numeric field (Qty, Price, GST%) accepts negative numbers when it shouldn't?
135. Is there any place where a required field can be bypassed by pressing Enter instead of clicking Submit?
136. Are toast notifications used consistently for all success/error feedback (no leftover browser alert() or confirm() anywhere)?
137. Does the app work correctly on a smaller/mobile-width browser window, or does anything visibly break?
138. Is there a consistent way to know "who is logged in" and "what they can do" visible somewhere at all times (not just buried in Users)?

## P. Data Integrity / Accidental Actions

139. If a user accidentally submits a duplicate Inward entry (double-click), does the backend idempotency guard actually prevent the duplicate row?
140. If a user accidentally deletes a Cupboard that has real placed items, is there a clear warning before it's too late, and can it be undone via Recycle Bin?
141. If a user accidentally issues (Outward) the wrong quantity, can they immediately Return it, and does that correctly reverse the numbers?
142. If a user accidentally creates a duplicate Vendor, is there any duplicate-detection (like Item Master has), or can duplicates freely accumulate?
143. If someone edits an Invoice-linked Stock_Register entry after the fact (e.g. fixing a typo), does it correctly update everywhere that invoice is referenced, or create inconsistency?
144. Is there any action in the entire app that is IRREVERSIBLE (no undo, no recycle bin, no confirmation) that probably should have one?
145. If two people edit the same record (e.g. same Item Master entry) at nearly the same time, what happens — last write wins silently, or is there any conflict indication?

## Q. Performance & Reliability

146. Does the app feel fast on a genuinely clean single-tab, single-server test (confirm this has actually been tested, not assumed)?
147. Do the staggered polling intervals actually prevent backend quota errors under normal single-user use?
148. Is there any remaining page with a heavy synchronous calculation that could cause lag on large datasets (500+ items/entries)?
149. Does hovering rapidly across many items (e.g. scrolling through Item Master while hovering) still feel smooth, or does it stutter?
150. Is there a plan/readiness check for what happens if the Item_Master or Stock_Register sheet grows to 1000+, 5000+ rows — will the current polling/dedup/fetch approach still hold up?

---

## Instructions for the agent answering these

- Go through in batches (suggest 15-20 at a time).
- For each: state **Working / Broken / Missing / N/A**, plus a one-line reason based on actually checking the code or testing in-browser — not assumption.
- Flag anything found broken as its own follow-up item, don't fix inline during the audit unless trivial (e.g. typo).
- At the end of each batch, summarize how many were Working vs Broken vs Missing, so progress is trackable.
