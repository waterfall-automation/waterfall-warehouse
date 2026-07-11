'use server';
/**
 * @fileOverview An AI agent that analyzes inventory data to suggest optimal restocking priorities.
 *
 * - restockingPrioritySuggestions - A function that handles the restocking priority suggestion process.
 * - RestockingPrioritySuggestionsInput - The input type for the restockingPrioritySuggestions function.
 * - RestockingPrioritySuggestionsOutput - The return type for the restockingPrioritySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InventoryItemSchema = z.object({
  itemName: z.string().describe('The name of the inventory item.'),
  itemCode: z.string().describe('The unique code for the inventory item.'),
  currentStock: z.number().describe('The current quantity of the item in stock.'),
  threshold: z.number().describe('The minimum stock level before the item is considered low.'),
  last7DaysOutwardQuantity: z.number().optional().describe('The total quantity of this item issued or dispatched in the last 7 days.'),
});

const RestockingPrioritySuggestionsInputSchema = z.object({
  inventoryData: z.array(InventoryItemSchema).describe('An array of inventory items with their current stock levels and thresholds.'),
});
export type RestockingPrioritySuggestionsInput = z.infer<typeof RestockingPrioritySuggestionsInputSchema>;

const RestockingSuggestionSchema = z.object({
  itemName: z.string().describe('The name of the inventory item.'),
  priority: z.enum(['High', 'Medium', 'Low', 'No Action Needed']).describe('The suggested restocking priority for the item.'),
  reason: z.string().describe('A brief explanation for the assigned priority, considering current stock, threshold, and recent demand.'),
});

const RestockingPrioritySuggestionsOutputSchema = z.object({
  suggestions: z.array(RestockingSuggestionSchema).describe('A list of suggested restocking priorities for inventory items.'),
  summary: z.string().describe('A brief overall summary of the inventory status and recent trends.'),
});
export type RestockingPrioritySuggestionsOutput = z.infer<typeof RestockingPrioritySuggestionsOutputSchema>;

export async function restockingPrioritySuggestions(input: RestockingPrioritySuggestionsInput): Promise<RestockingPrioritySuggestionsOutput> {
  return restockingPrioritySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'restockingPrioritySuggestionsPrompt',
  input: {schema: RestockingPrioritySuggestionsInputSchema},
  output: {schema: RestockingPrioritySuggestionsOutputSchema},
  prompt: `You are an AI Inventory Advisor for "SiccaSync", an inventory management system. Your task is to analyze the provided inventory data and suggest optimal restocking priorities.\n\nFor each item, consider the 'currentStock' relative to its 'threshold' and any 'last7DaysOutwardQuantity' to determine its priority.\n\nPriorities should be classified as:\n- 'High': Current stock is significantly below or at the threshold, especially if there's high recent demand.\n- 'Medium': Current stock is slightly below or near the threshold, or demand is moderate.\n- 'Low': Current stock is above the threshold but could warrant a small restock based on consistent, low-level demand.\n- 'No Action Needed': Current stock is well above the threshold, and there's no immediate concern.\n\nProvide a clear reason for each assigned priority.\n\nAlso, provide a brief overall summary of the current inventory status, highlighting any general trends or critical areas.\n\nInventory Data:\n{{#each inventoryData}}\n- Item Name: {{{itemName}}} (Code: {{{itemCode}}})\n  Current Stock: {{{currentStock}}}\n  Threshold: {{{threshold}}}\n  Recent Outward (last 7 days): {{{last7DaysOutwardQuantity}}}\n{{/each}}`,
});

const restockingPrioritySuggestionsFlow = ai.defineFlow(
  {
    name: 'restockingPrioritySuggestionsFlow',
    inputSchema: RestockingPrioritySuggestionsInputSchema,
    outputSchema: RestockingPrioritySuggestionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
