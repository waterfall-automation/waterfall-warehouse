"use client";

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { 
  HelpCircle, BookOpen, Video, Package, MapPin, Box, 
  ReceiptText, Users, ShieldAlert, Database, Info, 
  CheckCircle2, ArrowRightLeft, FileWarning
} from 'lucide-react';

export default function HelpPage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto py-2 animate-in fade-in duration-300">
        
        {/* Page Header */}
        <div className="flex flex-col gap-1.5 border-b pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-blue-600 shrink-0" />
            Help & Documentation Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Learn how to manage inventory, track invoices, navigate storage locations, and synchronize Google Sheets.
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/70 mb-6">
            <TabsTrigger value="guide" className="flex items-center gap-1.5 text-xs font-semibold">
              <BookOpen className="h-3.5 w-3.5" /> User Guide
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-1.5 text-xs font-semibold">
              <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1.5 text-xs font-semibold">
              <Video className="h-3.5 w-3.5" /> Walkthroughs
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: USER GUIDE */}
          <TabsContent value="guide" className="space-y-6 outline-none">
            
            {/* Stock Register Guide */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b bg-gray-50/50">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">Stock Register (Inward & Outward Entries)</CardTitle>
                  <CardDescription className="text-xs">Log new arrivals and issue outward shipments.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm text-gray-700 leading-relaxed">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span> Inward Entry Flow
                  </h4>
                  <p className="pl-3">
                    Click the <strong className="text-gray-900">Inward Entry</strong> button on the Stock Register. Choose whether the entry has an invoice (<strong className="text-gray-900">With Invoice</strong>) or is a direct entry (<strong className="text-gray-900">Without Invoice</strong>).
                  </p>
                  <ul className="list-disc pl-8 mt-1 space-y-1 text-xs text-muted-foreground">
                    <li><strong className="text-gray-700">Invoice No:</strong> Enter the vendor invoice number. The system will alert you if the invoice number already exists for that vendor.</li>
                    <li><strong className="text-gray-700">Autocompletion:</strong> As you type an item name, matching catalog items appear. Selecting one pre-fills details. If you enter a brand-new name, it is queued in the <strong className="text-blue-600">Pending Review</strong> catalog queue.</li>
                    <li><strong className="text-gray-700">Employee/Handled By:</strong> Defaults to your logged-in username for quick entry, but remains editable.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span> Outward Entry Flow
                  </h4>
                  <p className="pl-3">
                    Click the <strong className="text-gray-900">Outward Entry</strong> button. The picker only displays items that currently have positive placed stock. Select a location for each item in the picker, enter the quantity (which is capped at the location's available stock), and add it to the cart. Confirm the "Issued To" recipient name before submitting the shipment.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Storage Map Guide */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b bg-gray-50/50">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">Storage Map (Physical Layout)</CardTitle>
                  <CardDescription className="text-xs">Visualize, map, and organize stock across physical units.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm text-gray-700 leading-relaxed">
                <p>
                  The Storage Map divides physical storage into <strong className="text-gray-900">Cupboards</strong>, and each cupboard into <strong className="text-gray-900">Boxes</strong>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="border p-3 rounded-lg bg-gray-50/40">
                    <h5 className="font-bold text-gray-900 mb-1">Interactive Map Grid</h5>
                    <p className="text-muted-foreground">
                      Clicking on a Cupboard displays its sub-boxes. Hovering or clicking on a box details the exact item codes, names, and quantities physically stored inside.
                    </p>
                  </div>
                  <div className="border p-3 rounded-lg bg-gray-50/40">
                    <h5 className="font-bold text-gray-900 mb-1">Creating Locations</h5>
                    <p className="text-muted-foreground">
                      You can add new Cupboards and assign their physical grid coordinates. You can also seed custom boxes inside any cupboard. Use this map to reconcile digital sheet registers with warehouse reality.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Item Master Guide */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b bg-gray-50/50">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">Item Master & Product Catalog</CardTitle>
                  <CardDescription className="text-xs">Maintain core product details, thresholds, and metadata.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-sm text-gray-700 leading-relaxed">
                <p>
                  The Item Master stores the central repository of products. Adding an item to the catalog defines its metadata (Code, HSN, Category, Unit, Reorder Level, and Location) but does <strong className="text-gray-900">not</strong> seed initial stock quantity.
                </p>
                <div className="space-y-2">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-muted-foreground">Key Capabilities</h4>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong className="text-gray-900">Duplicate Prevention:</strong> If a catalog name is already registered, submission is blocked. Clicking an autocomplete suggestion will clear inputs to avoid duplicates.</li>
                    <li><strong className="text-gray-900">Fuzzy Similarity Check:</strong> Opening an item detail view highlights the top 3 similar items in the catalog using name similarity scoring.</li>
                    <li><strong className="text-gray-900">Recycle Bin:</strong> Deleting catalog entries is safe — deleted records are soft-deleted, moved to the Recovery Vault (Recycle Bin), and can be fully restored without losing past register references.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Invoices Guide */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b bg-gray-50/50">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">Invoices Tracking</CardTitle>
                  <CardDescription className="text-xs">Track vendor purchases, attachments, and GST details.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm text-gray-700 leading-relaxed">
                <p>
                  Purchases entered with invoices are aggregated on the <strong className="text-gray-900">Invoices</strong> page. Clicking an invoice card opens a drill-down detail panel showing:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                  <li>Invoice basic metadata (Invoice Number, Date, Total Purchase Amount, GST component).</li>
                  <li>A granular list of items included in that transaction.</li>
                  <li>Delete action: Admins can delete invoice headers, which details the affected inward entries that will be cleaned up.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Users & Roles Guide */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b bg-gray-50/50">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-gray-900">Users, Roles, & Permissions</CardTitle>
                  <CardDescription className="text-xs">Manage workspace accounts and access rights.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm text-gray-700 leading-relaxed">
                <p>
                  Access control is role-based. Go to <strong className="text-gray-900">Roles</strong> to define permission sets, and <strong className="text-gray-900">Users</strong> to assign roles to staff accounts.
                </p>
                <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2.5">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <strong className="font-semibold block mb-0.5">Developer Simulation Mode</strong>
                    For testing and verification, the navbar dropdown displays a "View As" utility. Developers can temporarily simulate different roles (e.g. Intern, Super Admin) to verify permission blocks.
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* TAB 2: FAQS */}
          <TabsContent value="faq" className="outline-none">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-bold text-gray-900">Frequently Asked Questions</CardTitle>
                <CardDescription className="text-xs">Quick answers to common operations.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Accordion type="single" collapsible className="w-full">
                  
                  <AccordionItem value="inward-stock" className="border-b py-1">
                    <AccordionTrigger className="text-sm font-semibold hover:text-blue-600 text-left">
                      How do I record new incoming inventory (Inward Entry)?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-gray-600 leading-relaxed space-y-1">
                      <p>1. Go to the <strong className="text-gray-900">Stock Register</strong> page.</p>
                      <p>2. Click the blue <strong className="text-gray-900">Inward Entry</strong> button in the top right.</p>
                      <p>3. Select <strong className="text-gray-900">With Invoice</strong> if you have a bill, or <strong className="text-gray-900">Without Invoice</strong> for plain stock updates.</p>
                      <p>4. Type the Item Name. If the item exists in the catalog, click the autocomplete suggestion to fill the HSN and Unit. If it is new, type the full name; it will be routed to the Pending Review queue for approval.</p>
                      <p>5. Enter the quantity, unit price, tax bracket, and physical storage location, then submit.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="physical-mapping" className="border-b py-1">
                    <AccordionTrigger className="text-sm font-semibold hover:text-blue-600 text-left">
                      How do I place items in physical Storage Map?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-gray-600 leading-relaxed space-y-1.5">
                      <p>
                        Stock quantity is physically placed inside cupboards/boxes.
                      </p>
                      <p>
                        To map existing catalog items to a physical container:
                        Go to the <strong className="text-gray-900">Storage Map</strong>, click on a Cupboard, and select a Box. Inside the Box details, click <strong className="text-gray-900">Place Item</strong>, select the item code, type the quantity to map, and click Save.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="outward-picker" className="border-b py-1">
                    <AccordionTrigger className="text-sm font-semibold hover:text-blue-600 text-left">
                      Why are some items not appearing in the Outward picker?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-gray-600 leading-relaxed space-y-1.5">
                      <p>
                        The Outward picker only shows items that have **placed stock** in the Storage Map (i.e. quantity associated with a Cupboard/Box).
                      </p>
                      <p>
                        If an item has an overall positive quantity in the Item Master but has not been assigned to a physical Cupboard/Box, it cannot be selected for Outward shipping. Map it in the Storage Map first.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="pending-review" className="border-b py-1">
                    <AccordionTrigger className="text-sm font-semibold hover:text-blue-600 text-left">
                      What does the "Pending Review" queue do?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-gray-600 leading-relaxed space-y-1.5">
                      <p>
                        If an operator enters a new item name during Inward entry, the system keeps it hidden from the standard catalog to prevent spelling duplicates (e.g. typing "LED Bulb 9W" when "LED-Bulb 9w" already exists).
                      </p>
                      <p>
                        Managers can review these in the <strong className="text-gray-900">Item Master &rarr; Pending Review</strong> queue to:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-[11px]">
                        <li><strong className="text-gray-800">Approve:</strong> Seed it as a brand-new catalog item.</li>
                        <li><strong className="text-gray-800">Map to Match:</strong> Correct the entry's records by merging/mapping them to an existing item code.</li>
                        <li><strong className="text-gray-800">Reject:</strong> Discard the entry.</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="duplicate-invoices" className="border-b py-1">
                    <AccordionTrigger className="text-sm font-semibold hover:text-blue-600 text-left">
                      How does duplicate invoice safety check work?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-gray-600 leading-relaxed">
                      When submitting an Inward entry with an invoice, the system checks whether the combination of `Invoice No` and `Vendor Name` already exists. If found, a dialog appears warning you of the duplication and showing the date it was originally registered. You can choose to continue (if doing a manual correction) or cancel to inspect the entries.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="sync-engine" className="border-b py-1">
                    <AccordionTrigger className="text-sm font-semibold hover:text-blue-600 text-left">
                      How does the local-first sync and caching engine work?
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-gray-600 leading-relaxed space-y-1.5">
                      <p>
                        The application uses a high-performance IndexedDB cache. When you perform edits, the changes are saved to your browser cache instantly and then queued to synchronize with Google Sheets in the background.
                      </p>
                      <p>
                        This keeps the app incredibly responsive, even with slow Google Sheets APIs. You can view the synchronization queues and latency logs under the <strong className="text-gray-950">Activity Log</strong> page.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: VIDEOS */}
          <TabsContent value="videos" className="outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <Card className="border border-dashed border-gray-300 shadow-sm flex flex-col justify-between h-[280px]">
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                    <Video className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-bold text-gray-900">Basic Workflows Walkthrough</CardTitle>
                  <CardDescription className="text-xs">Video Walkthrough coming soon</CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <p className="text-xs text-muted-foreground mb-4">
                    A complete 5-minute screen recording demonstrating Inward Stock entries, invoice management, and Outward picking.
                  </p>
                  <div className="h-[90px] rounded-lg bg-gray-100 flex items-center justify-center border border-dashed border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Video Placeholder</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-dashed border-gray-300 shadow-sm flex flex-col justify-between h-[280px]">
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                    <Video className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-bold text-gray-900">Physical Mapping & Layouts</CardTitle>
                  <CardDescription className="text-xs">Video Walkthrough coming soon</CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <p className="text-xs text-muted-foreground mb-4">
                    Learn how to set up physical cupboards, coordinates, box placements, and reconcile stock locations.
                  </p>
                  <div className="h-[90px] rounded-lg bg-gray-100 flex items-center justify-center border border-dashed border-gray-200">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Video Placeholder</span>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>

      </div>
    </AppShell>
  );
}
