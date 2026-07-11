/**
 * ─── PAGE VISIBILITY CONFIG ────────────────────────────────────────────────
 * Set each page to true (visible) or false (shows "Under Development").
 * This is the ONLY file you need to edit to enable/disable pages.
 */

export const PAGE_CONFIG = {
  dashboard:     true,   // Main dashboard with stats & AI advisor
  inventory:     true,   // Stock Register — Inward/Outward entries
  invoices:      true,   // Invoices — grouped by Invoice_No, item drill-down
  inventoryMap:  true,   // Storage Map — visual cupboard grid
  itemMaster:    true,   // Item Master — product catalogue
  vendors:       true,   // Vendor Master — supplier directory
  gstSummary:    true,   // GST / Taxation ledger
  noticeBoard:   true,   // Notice Board — announcements
  tasks:         true,   // Action item tasks
  users:         true,   // User management
  roles:         true,   // Role & permissions management
  registers:     false,  // Custom register builder (coming soon)
  activityLog:   true,   // Activity log / audit trail
  recycleBin:    true,   // Recycle bin for deleted entries
  settings:      true,   // App settings
} as const;

export type PageKey = keyof typeof PAGE_CONFIG;
