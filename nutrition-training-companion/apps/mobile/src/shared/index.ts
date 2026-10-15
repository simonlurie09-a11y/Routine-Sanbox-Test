/* The domain logic and data shared with the prototype (one source of truth):
   evidence gate, health rating, split review, readiness, GS1 barcode and QR
   parsing, the exercise catalogue, generic foods and the evidence library.
   Generated into companion.generated.js by scripts/sync-shared.mjs. */
// @ts-ignore: plain JavaScript module, typed loosely below.
import { data as rawData, domain as rawDomain } from './companion.generated.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const data: any = rawData;
export const domain: any = rawDomain;

/* The app never shows the prototype's fictional sample products: barcodes are
   looked up in Open Food Facts instead (src/services/openFoodFacts.ts). */
data.PRODUCTS.length = 0;

export type Nutrients = {
  energyKcal: number | null; proteinG: number | null; carbohydrateG: number | null; sugarsG: number | null;
  fatG: number | null; saturatedFatG: number | null; fiberG: number | null; sodiumMg: number | null;
};
export type Food = {
  id: string; name: string; brand?: string | null; gtin?: string | null; source: string; attribution?: string | null;
  serving: { grams: number; label: string }; nutrients: Nutrients; ingredients?: string | null; nova?: number | null;
  additives?: string[]; isBeverage?: boolean; confidence?: 'high' | 'medium' | 'low'; createdAt?: number; imageUrl?: string | null;
};
export type Claim = { key: string; title: string; status: string; statement: string; sources: string[]; contradicting: string[]; context: string[]; [k: string]: any };
export type Source = { id: string; short: string; title: string; authors: string; year: number; journal: string; citation: string; pmid?: string | null; doi?: string | null; url?: string | null; checks: Record<string, string>; [k: string]: any };
