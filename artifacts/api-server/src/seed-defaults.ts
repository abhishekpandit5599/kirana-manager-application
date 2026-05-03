// Seed script — Run: npx tsx src/seed-defaults.ts
import { db, defaultItemsTable } from "@workspace/db";

const DEFAULT_KIRANA_ITEMS = [
  // Grains & Flour
  { name: "Basmati Rice", category: "Grains", price: "80", unit: "kg" },
  { name: "Sona Masoori Rice", category: "Grains", price: "55", unit: "kg" },
  { name: "Brown Rice", category: "Grains", price: "90", unit: "kg" },
  { name: "Atta (Wheat Flour)", category: "Grains", price: "40", unit: "kg" },
  { name: "Maida (Refined Flour)", category: "Grains", price: "35", unit: "kg" },
  { name: "Besan (Gram Flour)", category: "Grains", price: "70", unit: "kg" },
  { name: "Suji (Semolina)", category: "Grains", price: "45", unit: "kg" },
  { name: "Poha (Flattened Rice)", category: "Grains", price: "50", unit: "kg" },
  { name: "Daliya (Broken Wheat)", category: "Grains", price: "40", unit: "kg" },
  { name: "Corn Flour", category: "Grains", price: "60", unit: "kg" },
  // Pulses & Lentils
  { name: "Dal Chana", category: "Pulses", price: "90", unit: "kg" },
  { name: "Dal Moong", category: "Pulses", price: "110", unit: "kg" },
  { name: "Dal Toor (Arhar)", category: "Pulses", price: "100", unit: "kg" },
  { name: "Dal Urad", category: "Pulses", price: "120", unit: "kg" },
  { name: "Masoor Dal", category: "Pulses", price: "85", unit: "kg" },
  { name: "Rajma (Kidney Beans)", category: "Pulses", price: "130", unit: "kg" },
  { name: "Chole (Chickpeas)", category: "Pulses", price: "80", unit: "kg" },
  { name: "Moong Sabut (Whole)", category: "Pulses", price: "100", unit: "kg" },
  { name: "Lobia (Black Eyed Peas)", category: "Pulses", price: "90", unit: "kg" },
  // Oils
  { name: "Mustard Oil", category: "Oils", price: "130", unit: "litre" },
  { name: "Refined Oil (Soybean)", category: "Oils", price: "120", unit: "litre" },
  { name: "Sunflower Oil", category: "Oils", price: "140", unit: "litre" },
  { name: "Coconut Oil", category: "Oils", price: "180", unit: "litre" },
  { name: "Groundnut Oil", category: "Oils", price: "160", unit: "litre" },
  { name: "Olive Oil", category: "Oils", price: "400", unit: "litre" },
  { name: "Sesame Oil (Til)", category: "Oils", price: "250", unit: "litre" },
  // Spices
  { name: "Salt", category: "Spices", price: "20", unit: "kg" },
  { name: "Red Chili Powder", category: "Spices", price: "200", unit: "kg" },
  { name: "Turmeric Powder (Haldi)", category: "Spices", price: "150", unit: "kg" },
  { name: "Coriander Powder (Dhaniya)", category: "Spices", price: "120", unit: "kg" },
  { name: "Garam Masala", category: "Spices", price: "250", unit: "kg" },
  { name: "Cumin Seeds (Jeera)", category: "Spices", price: "200", unit: "kg" },
  { name: "Mustard Seeds (Rai)", category: "Spices", price: "100", unit: "kg" },
  { name: "Black Pepper", category: "Spices", price: "500", unit: "kg" },
  { name: "Cloves (Laung)", category: "Spices", price: "800", unit: "kg" },
  { name: "Cardamom (Elaichi)", category: "Spices", price: "1500", unit: "kg" },
  { name: "Cinnamon (Dalchini)", category: "Spices", price: "300", unit: "kg" },
  { name: "Bay Leaves (Tej Patta)", category: "Spices", price: "200", unit: "kg" },
  { name: "Fennel Seeds (Saunf)", category: "Spices", price: "150", unit: "kg" },
  { name: "Fenugreek Seeds (Methi)", category: "Spices", price: "80", unit: "kg" },
  { name: "Asafoetida (Hing)", category: "Spices", price: "400", unit: "kg" },
  { name: "Garlic", category: "Spices", price: "100", unit: "kg" },
  { name: "Ginger", category: "Spices", price: "80", unit: "kg" },
  { name: "Dry Red Chili", category: "Spices", price: "250", unit: "kg" },
  // Sweeteners
  { name: "Sugar", category: "Sweeteners", price: "45", unit: "kg" },
  { name: "Jaggery (Gur)", category: "Sweeteners", price: "60", unit: "kg" },
  { name: "Honey", category: "Sweeteners", price: "350", unit: "kg" },
  // Beverages
  { name: "Tea Leaves (Chai)", category: "Beverages", price: "400", unit: "kg" },
  { name: "Coffee Powder", category: "Beverages", price: "500", unit: "kg" },
  { name: "Rooh Afza", category: "Beverages", price: "130", unit: "pcs" },
  // Dairy
  { name: "Milk", category: "Dairy", price: "60", unit: "litre" },
  { name: "Ghee", category: "Dairy", price: "500", unit: "kg" },
  { name: "Butter", category: "Dairy", price: "50", unit: "pcs" },
  { name: "Curd (Dahi)", category: "Dairy", price: "40", unit: "kg" },
  { name: "Paneer", category: "Dairy", price: "300", unit: "kg" },
  { name: "Eggs", category: "Dairy", price: "8", unit: "pcs" },
  { name: "Cheese Slice", category: "Dairy", price: "120", unit: "pcs" },
  // Snacks
  { name: "Biscuits (Parle-G)", category: "Snacks", price: "5", unit: "pcs" },
  { name: "Biscuits (Marie Gold)", category: "Snacks", price: "30", unit: "pcs" },
  { name: "Namkeen (Bhujia)", category: "Snacks", price: "20", unit: "pcs" },
  { name: "Chips (Lays)", category: "Snacks", price: "20", unit: "pcs" },
  { name: "Kurkure", category: "Snacks", price: "20", unit: "pcs" },
  { name: "Noodles (Maggi)", category: "Snacks", price: "14", unit: "pcs" },
  { name: "Bread", category: "Snacks", price: "40", unit: "pcs" },
  // Hygiene & Cleaning
  { name: "Soap (Lifebuoy)", category: "Hygiene", price: "30", unit: "pcs" },
  { name: "Soap (Lux)", category: "Hygiene", price: "35", unit: "pcs" },
  { name: "Shampoo (Sachet)", category: "Hygiene", price: "3", unit: "pcs" },
  { name: "Toothpaste (Colgate)", category: "Hygiene", price: "50", unit: "pcs" },
  { name: "Toothbrush", category: "Hygiene", price: "30", unit: "pcs" },
  { name: "Detergent Powder", category: "Cleaning", price: "80", unit: "kg" },
  { name: "Dishwash Bar (Vim)", category: "Cleaning", price: "15", unit: "pcs" },
  { name: "Dish Liquid", category: "Cleaning", price: "60", unit: "pcs" },
  { name: "Phenyl", category: "Cleaning", price: "40", unit: "litre" },
  { name: "Floor Cleaner", category: "Cleaning", price: "80", unit: "litre" },
  // Vegetables
  { name: "Onion", category: "Vegetables", price: "30", unit: "kg" },
  { name: "Potato", category: "Vegetables", price: "25", unit: "kg" },
  { name: "Tomato", category: "Vegetables", price: "40", unit: "kg" },
  { name: "Green Chili", category: "Vegetables", price: "60", unit: "kg" },
  { name: "Lemon", category: "Vegetables", price: "80", unit: "kg" },
  { name: "Coriander Leaves", category: "Vegetables", price: "10", unit: "pcs" },
  { name: "Mint Leaves (Pudina)", category: "Vegetables", price: "10", unit: "pcs" },
  // Miscellaneous
  { name: "Matchbox", category: "Miscellaneous", price: "2", unit: "pcs" },
  { name: "Candles", category: "Miscellaneous", price: "15", unit: "pcs" },
  { name: "Agarbatti (Incense)", category: "Miscellaneous", price: "25", unit: "pcs" },
  { name: "Camphor (Kapoor)", category: "Miscellaneous", price: "30", unit: "pcs" },
  { name: "Batteries", category: "Miscellaneous", price: "20", unit: "pcs" },
  { name: "Plastic Bags (Carry)", category: "Miscellaneous", price: "30", unit: "pack" },
  { name: "Thread (Sewing)", category: "Miscellaneous", price: "15", unit: "pcs" },
  // Pickles & Sauces
  { name: "Tomato Ketchup", category: "Sauces", price: "90", unit: "pcs" },
  { name: "Pickle (Achar)", category: "Pickles", price: "80", unit: "kg" },
  { name: "Soy Sauce", category: "Sauces", price: "45", unit: "pcs" },
  { name: "Vinegar", category: "Sauces", price: "35", unit: "pcs" },
  // Dry Fruits
  { name: "Almonds (Badam)", category: "Dry Fruits", price: "800", unit: "kg" },
  { name: "Cashews (Kaju)", category: "Dry Fruits", price: "900", unit: "kg" },
  { name: "Raisins (Kishmish)", category: "Dry Fruits", price: "300", unit: "kg" },
  { name: "Peanuts (Mungfali)", category: "Dry Fruits", price: "100", unit: "kg" },
  // Paan / Tobacco (common in kirana)
  { name: "Pan Masala", category: "Paan", price: "10", unit: "pcs" },
  { name: "Supari", category: "Paan", price: "5", unit: "pcs" },
  { name: "Saunf (Mouth Freshener)", category: "Paan", price: "20", unit: "pcs" },
];

async function seed() {
  console.log("Seeding default items...");
  const existing = await db.select().from(defaultItemsTable);
  if (existing.length > 0) {
    console.log(`Already have ${existing.length} default items. Skipping.`);
    process.exit(0);
  }
  await db.insert(defaultItemsTable).values(DEFAULT_KIRANA_ITEMS);
  console.log(`✅ Seeded ${DEFAULT_KIRANA_ITEMS.length} default kirana items`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
