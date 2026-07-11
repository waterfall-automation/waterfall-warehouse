import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeStr(val: unknown): string {
  return String(val ?? '').trim();
}

export function getSimilarity(s1: string, s2: string): number {
  const words1 = safeStr(s1).toLowerCase().split(/\s+/).filter(Boolean);
  const words2 = safeStr(s2).toLowerCase().split(/\s+/).filter(Boolean);
  if (words1.length === 0 || words2.length === 0) return 0;
  const intersection = words1.filter(w => words2.includes(w));
  return intersection.length / Math.max(words1.length, words2.length);
}
