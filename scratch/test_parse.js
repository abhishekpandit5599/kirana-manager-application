
const HINDI_MAP = {
  chawal: "rice", chaawal: "rice", atta: "atta", gehun: "wheat", dal: "dal",
  chana: "chana", moong: "moong", toor: "toor", arhar: "toor", tel: "oil",
  sarson: "mustard oil", refine: "refined oil", cheeni: "sugar", chini: "sugar",
  namak: "salt", mirch: "chili", lal: "red", haldi: "turmeric", dhaniya: "coriander",
  masala: "masala", chai: "tea", dudh: "milk", doodh: "milk", ghee: "ghee",
  biscuit: "biscuits", sabun: "soap", kapda: "detergent", maachis: "matchbox",
  mombati: "candles", pyaz: "onion", aloo: "potato", tamatar: "tomato",
  lehsun: "garlic", adrak: "ginger", ande: "eggs", anda: "eggs",
};

const UNIT_MAP = {
  kilo: "kg", kilogram: "kg", kilograms: "kg", kg: "kg",
  liter: "litre", liters: "litre", litre: "litre", litres: "litre", ltr: "litre", l: "litre",
  gram: "gm", grams: "gm", gms: "gm", gm: "gm", g: "gm",
  piece: "pcs", pieces: "pcs", pcs: "pcs", pc: "pcs",
  number: "pcs", nos: "pcs", dozen: "dozen", pack: "pack", packet: "pack", packets: "pack",
  box: "box",
};

function normalizeUnit(unit) { return UNIT_MAP[unit.toLowerCase().trim()] || "pcs"; }
function translateHindi(word) { return HINDI_MAP[word.toLowerCase().trim()] || word; }

function parseItemsFromText(text) {
  const items = [];
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
        const index = numberMatch.index;
        const num = numberMatch[0];
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

    let quantity = 1;
    let unit = "pcs";
    
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
      
      const afterQty = quantityStr.substring(qtyMatch.index + q.length).trim().toLowerCase();
      // Use word boundaries for units to avoid partial matches (e.g. "big" matching "g")
      const unitRegex = /\b(kg|kilo|kilogram|gms?|gram?|litre?|liter?|ltr|gm?|pcs?|piece?|dozen|pack(?:et)?|box|number|nos?)\b/i;
      const unitMatch = afterQty.match(unitRegex);
      if (unitMatch) {
        unit = normalizeUnit(unitMatch[1]);
      }
    }

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

const testText = `E-
OTHER INGREDIENTS

Papad - 1 big packet

Cocoa powder - 100 gms

Health drinks(horlicks,complan etc) - 1/2 kg each
Noodles - 1 packet

Pasta - 200 gms

Macaroni - 200 gms

Sphagetti(optional) - 1 box

Poha(thick/thin) - 1 kg

FOR BACHELORS

Ready made rice mix

Sambar powder - 100 gms

Rasam powder - 100 gms

Vathakuzhambu powder - 100 gms

Ginger, Garlic paste - Small packet

Tamarind paste - 100 gms

Ready to eat products

©Chifra's Food Book`;

console.log(JSON.stringify(parseItemsFromText(testText), null, 2));
