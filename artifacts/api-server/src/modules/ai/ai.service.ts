import { db, itemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

interface ParsedItem { name: string; quantity: number; unit: string; }

const HINDI_MAP: Record<string, string> = {
  chawal: "rice", chaawal: "rice", atta: "atta", gehun: "wheat", dal: "dal",
  chana: "chana", moong: "moong", toor: "toor", arhar: "toor", tel: "oil",
  sarson: "mustard oil", refine: "refined oil", cheeni: "sugar", chini: "sugar",
  namak: "salt", mirch: "chili", lal: "red", haldi: "turmeric", dhaniya: "coriander",
  masala: "masala", chai: "tea", dudh: "milk", doodh: "milk", ghee: "ghee",
  biscuit: "biscuits", sabun: "soap", kapda: "detergent", maachis: "matchbox",
  mombati: "candles", pyaz: "onion", aloo: "potato", tamatar: "tomato",
  lehsun: "garlic", adrak: "ginger", ande: "eggs", anda: "eggs",
};

const UNIT_MAP: Record<string, string> = {
  kilo: "kg", kilogram: "kg", kilograms: "kg", kg: "kg",
  liter: "litre", liters: "litre", litre: "litre", litres: "litre", ltr: "litre", l: "litre",
  gram: "gm", grams: "gm", gm: "gm", g: "gm",
  piece: "pcs", pieces: "pcs", pcs: "pcs", pc: "pcs",
  number: "pcs", nos: "pcs", dozen: "dozen", pack: "pack", packet: "pack", packets: "pack",
};

function normalizeUnit(unit: string): string { return UNIT_MAP[unit.toLowerCase().trim()] || "pcs"; }
function translateHindi(word: string): string { return HINDI_MAP[word.toLowerCase().trim()] || word; }

function parseItemsFromText(text: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = text.split(/[,\n;]/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const numberUnitNamePattern = /^(\d+(?:\.\d+)?)\s*(kg|kilo|kilogram|litre?|liter?|ltr|gm?|gram?|pcs?|piece?|dozen|pack(?:et)?|number|nos?)?\s+(.+)/i;
    const nameNumberUnitPattern = /^(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|kilo|kilogram|litre?|liter?|ltr|gm?|gram?|pcs?|piece?|dozen|pack(?:et)?|number|nos?)?\s*$/i;
    let match = trimmed.match(numberUnitNamePattern);
    if (match) {
      items.push({ name: match[3].trim().split(/\s+/).map(translateHindi).join(" "), quantity: parseFloat(match[1]), unit: normalizeUnit(match[2] || "pcs") });
      continue;
    }
    match = trimmed.match(nameNumberUnitPattern);
    if (match) {
      items.push({ name: match[1].trim().split(/\s+/).map(translateHindi).join(" "), quantity: parseFloat(match[2]), unit: normalizeUnit(match[3] || "pcs") });
    }
  }
  return items;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (!q || !t) return 0;

  if (q === t) return 1;

  const distance = levenshteinDistance(q, t);
  const maxLength = Math.max(q.length, t.length);
  const similarity = 1 - distance / maxLength;

  const qWords = q.split(/\s+/).filter(Boolean);
  const tWords = t.split(/\s+/).filter(Boolean);

  if (qWords.length === 0 || tWords.length === 0) return similarity;

  let wordMatches = 0;
  for (const qw of qWords) {
    let bestWordSim = 0;
    for (const tw of tWords) {
      if (qw === tw) {
        bestWordSim = 1;
      } else if (tw.includes(qw) && qw.length > 2) {
        bestWordSim = Math.max(bestWordSim, 0.9);
      } else {
        const d = levenshteinDistance(qw, tw);
        const sim = 1 - d / Math.max(qw.length, tw.length);
        if (sim > bestWordSim) bestWordSim = sim;
      }
    }
    wordMatches += bestWordSim;
  }

  const wordSimilarity = wordMatches / Math.max(qWords.length, tWords.length);

  return Math.max(similarity, wordSimilarity);
}

async function matchItemsToInventory(parsedItems: ParsedItem[], shopId: string) {
  const inventoryItems = await db.select().from(itemsTable).where(eq(itemsTable.shopId, shopId));
  return parsedItems.map((parsed) => {
    let bestMatch: { id: string; name: string } | null = null;
    let bestScore = 0;
    for (const inv of inventoryItems) {
      const score = fuzzyMatch(parsed.name, inv.name);
      if (score > bestScore && score > 0.3) { bestScore = score; bestMatch = { id: inv.id, name: inv.name }; }
    }
    return {
      name: parsed.name,
      quantity: bestMatch ? parsed.quantity : 0, // If no match, empty qty for manual edit
      unit: parsed.unit,
      matchedItemId: bestMatch?.id ?? null,
      matchedItemName: bestMatch?.name ?? null,
      confidence: Math.round(bestScore * 100) / 100,
    };
  }).filter(item => item.matchedItemId !== null);
}

export const aiService = {
  async processOcr(shopId: string, imageBase64?: string, imageBuffer?: Buffer) {
    try {
      let rawText = "";

      if (imageBuffer) {
        // Use tesseract.js if available
        try {
          const { createWorker } = await import("tesseract.js");
          const worker = await createWorker(["eng", "hin"]);
          const { data } = await worker.recognize(imageBuffer);
          rawText = data.text;
          await worker.terminate();
        } catch {
          rawText = ""; // fallback demo
        }
      } else {
        rawText = ""; // demo mode
      }

      const parsedItems = parseItemsFromText(rawText);
      const matchedItems = await matchItemsToInventory(parsedItems, shopId);
      return { items: matchedItems, rawText, success: true };
    } catch {
      return { items: [], rawText: "", success: false };
    }
  },

  async processVoice(shopId: string, text: string) {
    try {
      const parsedItems = parseItemsFromText(text);
      const matchedItems = await matchItemsToInventory(parsedItems, shopId);
      return { items: matchedItems, rawText: text, success: true };
    } catch {
      return { items: [], rawText: text, success: false };
    }
  },
};
