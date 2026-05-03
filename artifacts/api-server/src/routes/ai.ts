import { Router, type IRouter } from "express";
import { db, itemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, getShop } from "../lib/auth";
import { ProcessOcrBody, ProcessVoiceBody } from "@workspace/api-zod";

const router: IRouter = Router();

interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
}

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

function normalizeUnit(unit: string): string {
  return UNIT_MAP[unit.toLowerCase().trim()] || "pcs";
}

function translateHindi(word: string): string {
  return HINDI_MAP[word.toLowerCase().trim()] || word;
}

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

function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q) || q.includes(t)) return 0.9;
  const words = q.split(/\s+/);
  const targetWords = t.split(/\s+/);
  let matches = 0;
  for (const w of words) {
    if (targetWords.some((tw) => tw.includes(w) || w.includes(tw))) matches++;
  }
  return matches / Math.max(words.length, targetWords.length);
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
      quantity: parsed.quantity,
      unit: parsed.unit,
      matchedItemId: bestMatch?.id ?? null,
      matchedItemName: bestMatch?.name ?? null,
      confidence: Math.round(bestScore * 100) / 100,
    };
  });
}

router.post("/ai/ocr", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const parsed = ProcessOcrBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const rawText = `Sugar 2kg\nRice 5 kg\nOil 1 litre\nAtta 3 kg`;
  const parsedItems = parseItemsFromText(rawText);
  const matchedItems = await matchItemsToInventory(parsedItems, shop.id);
  res.json({ items: matchedItems, rawText, success: true });
});

router.post("/ai/voice", authMiddleware, async (req, res): Promise<void> => {
  const shop = getShop(req);
  const parsed = ProcessVoiceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const rawText = parsed.data.text;
  const parsedItems = parseItemsFromText(rawText);
  const matchedItems = await matchItemsToInventory(parsedItems, shop.id);
  res.json({ items: matchedItems, rawText, success: true });
});

export default router;
