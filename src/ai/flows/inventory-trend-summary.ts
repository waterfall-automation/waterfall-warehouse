'use server';
/**
 * @fileOverview An AI Inventory Advisor agent that summarizes inventory trends.
 *
 * - generateInventoryTrendSummary - A function that handles the generation of inventory trend summaries.
 * - InventoryTrendSummaryInput - The input type for the generateInventoryTrendSummary function.
 * - InventoryTrendSummaryOutput - The return type for the generateInventoryTrendSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const ItemMasterSchema = z.object({
  itemName: z.string().describe('The name of the inventory item.'),
  itemCode: z.string().describe('The unique code for the inventory item.'),
  balanceQty: z.number().describe('The current balance quantity of the item.'),
  threshold: z.number().describe('The low stock threshold for the item.'),
  location: z.string().describe('The storage location of the item.'),
});

const StockRegisterEntrySchema = z.object({
  date: z.string().describe('The date of the stock transaction (DD-MM-YYYY HH:MM).'),
  itemName: z.string().describe('The name of the item involved in the transaction.'),
  type: z.enum(['Inward', 'Outward']).describe('The type of transaction (Inward or Outward).'),
  quantity: z.number().describe('The quantity of items in the transaction.'),
  employeeName: z.string().describe('The employee who performed the transaction.'),
});

const InventoryTrendSummaryInputSchema = z.object({
  items: z.array(ItemMasterSchema).describe('A list of all inventory items with their current status.'),
  recentStockRegisterEntries: z.array(StockRegisterEntrySchema).describe('A list of recent stock register transactions.'),
});
export type InventoryTrendSummaryInput = z.infer<typeof InventoryTrendSummaryInputSchema>;

// Output Schema
const HighMovementItemSchema = z.object({
  itemName: z.string().describe('The name of the item with high movement.'),
  recentActivity: z.string().describe('A brief description of its recent movement (e.g., "High outward movement in the last week").'),
});

const LowStockItemSchema = z.object({
  itemName: z.string().describe('The name of the item nearing or below its threshold.'),
  currentStock: z.number().describe('The current stock quantity of the item.'),
  threshold: z.number().describe('The low stock threshold for the item.'),
  suggestion: z.string().describe('A suggestion for this item (e.g., "Consider reordering soon").'),
});

const InventoryTrendSummaryOutputSchema = z.object({
  overallSummary: z.string().describe('A concise overall summary of the inventory health and recent activity.'),
  highMovementItems: z.array(HighMovementItemSchema).describe('A list of items that have experienced significant recent activity (inward or outward).'),
  lowStockItems: z.array(LowStockItemSchema).describe('A list of items that are currently at or below their low stock threshold.'),
});
export type InventoryTrendSummaryOutput = z.infer<typeof InventoryTrendSummaryOutputSchema>;

/**
 * Generates an AI-powered summary of recent inventory activity and key trends.
 * @param input - The inventory data and recent stock register entries.
 * @returns A summary highlighting overall health, high movement items, and low stock items.
 */
export async function generateInventoryTrendSummary(input: InventoryTrendSummaryInput): Promise<InventoryTrendSummaryOutput> {
  return inventoryTrendSummaryFlow(input);
}

const inventoryTrendSummaryPrompt = ai.definePrompt({
  name: 'inventoryTrendSummaryPrompt',
  input: { schema: InventoryTrendSummaryInputSchema },
  output: { schema: InventoryTrendSummaryOutputSchema },
  prompt: `You are an AI Inventory Advisor for "SiccaSync". Your task is to analyze the provided inventory data and recent stock transactions to generate a brief summary of the overall inventory health and highlight key trends.

Focus on identifying:
1. Overall Summary: A concise overview of the current inventory status and recent activity. Mention if the inventory seems stable, growing, or declining, and note any general trends.
2. High Movement Items: List items that have had significant inward or outward movement recently. For each, describe the nature of their activity.
3. Low Stock Items: List items that are at or below their defined low stock threshold. For each, provide its current stock, threshold, and a brief suggestion (e.g., "Consider reordering").

Here is the inventory data:

Current Inventory Items:
{{{json items}}}

Recent Stock Register Entries:
{{{json recentStockRegisterEntries}}}

Analyze the data and provide the summary in the specified JSON format.
`,
});

const inventoryTrendSummaryFlow = ai.defineFlow(
  {
    name: 'inventoryTrendSummaryFlow',
    inputSchema: InventoryTrendSummaryInputSchema,
    outputSchema: InventoryTrendSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await inventoryTrendSummaryPrompt(input);
    if (!output) {
      throw new Error('Failed to generate inventory trend summary.');
    }
    return output;
  }
);
