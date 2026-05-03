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
  gram: "gm", grams: "gm", gms: "gm", gm: "gm", g: "gm",
  piece: "pcs", pieces: "pcs", pcs: "pcs", pc: "pcs",
  number: "pcs", nos: "pcs", dozen: "dozen", pack: "pack", packet: "pack", packets: "pack",
  box: "box",
};

function normalizeUnit(unit: string): string { return UNIT_MAP[unit.toLowerCase().trim()] || "pcs"; }
function translateHindi(word: string): string { return HINDI_MAP[word.toLowerCase().trim()] || word; }

function parseItemsFromText(text: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  // Split primarily by lines
  const lines = text.split(/\n/);
  
  for (const line of lines) {
    let trimmed = line.trim();
    if (!trimmed || trimmed.length < 2) continue;

    // Clean up common noise like (optional), (thick/thin), etc.
    trimmed = trimmed.replace(/\(.*?\)/g, "").replace(/etc\.?/gi, "").replace(/©.*/g, "").trim();

    let name = "";
    let quantityStr = "";
    
    // Try splitting by common separators like - or :
    const separatorMatch = trimmed.match(/^(.+?)\s*[-:–—]\s*(.+)$/);
    if (separatorMatch) {
      name = separatorMatch[1].trim();
      quantityStr = separatorMatch[2].trim();
    } else {
      // If no separator, try to find the transition between name and number
      const numberRegex = /(\d+(?:\/\d+)?(?:\.\d+)?)/;
      const numberMatch = trimmed.match(numberRegex);
      
      if (numberMatch) {
        const index = numberMatch.index!;
        const num = numberMatch[0];
        // If number is near start, it's [Quantity] [Name]
        if (index < trimmed.length / 3) {
          const potentialNameStart = trimmed.substring(index + num.length).trim();
          quantityStr = trimmed.substring(0, index + num.length + 10);
          name = potentialNameStart;
        } else {
          name = trimmed.substring(0, index).trim();
          quantityStr = trimmed.substring(index).trim();
        }
      } else {
        name = trimmed;
        quantityStr = "1";
      }
    }

    // Parse Quantity and Unit from the quantity string
    let quantity = 1;
    let unit = "pcs";
    
    // Support fractions (1/2), decimals (1.5), and integers
    const qtyMatch = quantityStr.match(/(\d+(?:\/\d+)?(?:\.\d+)?)/);
    if (qtyMatch) {
      const q = qtyMatch[0];
      try {
        if (q.includes("/")) {
          const [num, den] = q.split("/").map(parseFloat);
          quantity = den !== 0 ? num / den : 1;
        } else {
          quantity = parseFloat(q);
        }
      } catch {
        quantity = 1;
      }
      
      // Look for unit immediately after the number
      const afterQty = quantityStr.substring(qtyMatch.index! + q.length).trim().toLowerCase();
      const unitRegex = /\b(kg|kilo|kilogram|gms?|gram?|litre?|liter?|ltr|gm?|pcs?|piece?|dozen|pack(?:et)?|box|number|nos?)\b/i;
      const unitMatch = afterQty.match(unitRegex);
      if (unitMatch) {
        unit = normalizeUnit(unitMatch[1]);
      }
    }

    // Final cleanup: remove any trailing/leading dashes/noise from name
    name = name.replace(/^[-:–—\s]+|[-:–—\s]+$/g, "").trim();
    
    if (name.length > 1) {
      items.push({
        name: name.split(/\s+/).map(translateHindi).join(" "),
        quantity: isNaN(quantity) ? 1 : quantity,
        unit
      });
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

  // If one string is a substring of the other and they are reasonably long, boost it
  if ((t.includes(q) || q.includes(t)) && q.length > 3) {
    return Math.max(similarity, wordSimilarity, 0.85);
  }

  return Math.max(similarity, wordSimilarity);
}

async function matchItemsToInventory(parsedItems: ParsedItem[], shopId: string) {
  const inventoryItems = await db.select().from(itemsTable).where(eq(itemsTable.shopId, shopId));
  return parsedItems.map((parsed) => {
    let bestMatch: { id: string; name: string; unit: string; price: string } | null = null;
    let bestScore = 0;
    for (const inv of inventoryItems) {
      const score = fuzzyMatch(parsed.name, inv.name);
      if (score > bestScore && score > 0.5) {
        bestScore = score;
        bestMatch = { id: inv.id, name: inv.name, unit: inv.unit, price: inv.price };
      }
    }
    return {
      name: parsed.name,
      quantity: bestMatch ? parsed.quantity : 0,
      unit: parsed.unit,
      matchedItemId: bestMatch?.id ?? null,
      matchedItemName: bestMatch?.name ?? null,
      matchedItemUnit: bestMatch?.unit ?? null,
      matchedItemPrice: bestMatch?.price ?? null,
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
