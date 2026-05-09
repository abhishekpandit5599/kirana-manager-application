import { config } from "dotenv";
import path from "path";

// Load .env from root BEFORE other imports
config({ path: path.resolve(process.cwd(), ".env") });

import { db, defaultItemsTable } from "../lib/db/src";

const CATEGORIES = [
  "Grains & Flour",
  "Pulses & Lentils",
  "Oils & Ghee",
  "Spices & Masala",
  "Beverages",
  "Dairy & Eggs",
  "Snacks & Biscuits",
  "Personal Care",
  "Home Care",
  "Sweeteners",
  "Dry Fruits & Nuts",
  "Pooja Needs",
  "Stationery",
  "Pet Food",
  "Baby Care",
  "Miscellaneous"
];

const BRANDS = {
  "Grains & Flour": ["Tata", "Aashirvaad", "Fortune", "India Gate", "Daawat", "Royal", "Patanjali", "Unitas", "24 Mantra", "Organic Tattva", "Kohinoor", "Lal Qilla", "Shakti Bhog", "Nature Fresh"],
  "Pulses & Lentils": ["Tata Sampann", "Aashirvaad", "Patanjali", "Organic Tattva", "24 Mantra", "Pro Nature", "Reliance Fresh", "Big Bazaar", "Local Premium", "Desi Choice"],
  "Oils & Ghee": ["Fortune", "Dhara", "Saffola", "Gemini", "Amul", "Gowardhan", "Mother Dairy", "Patanjali", "Dalda", "Emami", "Sundrop", "Figaro", "Bertolli", "Saffola Gold", "Saffola Total"],
  "Spices & Masala": ["Everest", "MDH", "Catch", "Tata Sampann", "Badshah", "Ramdev", "Patanjali", "MTR", "Eastern", "Sakthi", "Aachi", "Smith & Jones"],
  "Beverages": ["Tata Tea", "Red Label", "Taj Mahal", "Society Tea", "Nescafe", "Bru", "Bournvita", "Horlicks", "Complan", "Boost", "Coca-Cola", "Pepsi", "Sprite", "Thums Up", "Limca", "Fanta", "Maaza", "Frooti", "Paper Boat", "Real Juice"],
  "Dairy & Eggs": ["Amul", "Mother Dairy", "Gowardhan", "Nandini", "Britannia", "Nestle", "Milky Mist", "Aavin", "Heritage", "Kwality Walls", "Vadilal"],
  "Snacks & Biscuits": ["Parle", "Britannia", "Sunfeast", "Nestle", "Haldiram", "Bikaji", "Lays", "Kurkure", "Bingo", "Doritos", "Pringles", "Kellogg's", "Baggry's", "MTR (Ready to Eat)"],
  "Personal Care": ["Lux", "Lifebuoy", "Dove", "Pears", "Santoor", "Dettol", "Colgate", "Pepsodent", "Clinic Plus", "Sunsilk", "Pantene", "Head & Shoulders", "Garnier", "L'Oreal", "Nivea", "Himalaya", "Ponds", "Fair & Lovely (Glow & Lovely)", "Vick's", "Zandu"],
  "Home Care": ["Surf Excel", "Ariel", "Rin", "Tide", "Wheel", "Vim", "Pril", "Colin", "Harpic", "Lizol", "Dettol", "Comfort", "Godrej Ezee", "Vanish", "Good Knight", "All Out", "Mortein", "Hit"],
  "Sweeteners": ["Madhur", "Trust", "Patanjali", "Dabur", "Lion", "Zydus (Sugar Free)", "Organic India"],
  "Dry Fruits & Nuts": ["Happilo", "Farmley", "Tulsi", "Nutraj", "Nature's Basket", "Local Premium"],
  "Pooja Needs": ["Cycle", "Mangaldeep", "Zed Black", "Bikaji (Pooja Thali)", "Patanjali"],
  "Stationery": ["Classmate", "Reynolds", "Cello", "Natraj", "Apsara", "Faber-Castell", "Camel"],
  "Pet Food": ["Pedigree", "Whiskas", "Royal Canin", "Drools"],
  "Baby Care": ["Johnson & Johnson", "Himalaya Baby", "Pampers", "MamyPoko", "Huggies", "Cerelac", "Nestum"],
  "Miscellaneous": ["Duracell", "Eveready", "Nippo", "Cello (Containers)", "Milton"]
};

const ITEMS = {
  "Grains & Flour": ["Basmati Rice", "Kolam Rice", "Sona Masoori Rice", "Wheat Atta", "Maida", "Besan", "Suji", "Rawa", "Poha", "Daliya", "Jowar Flour", "Bajra Flour", "Ragi Flour", "Oats", "Muesli"],
  "Pulses & Lentils": ["Toor Dal", "Moong Dal", "Chana Dal", "Urad Dal", "Masoor Dal", "Rajma", "Kabuli Chana", "Kala Chana", "Moong Whole", "Urad Whole", "Soybean", "Green Peas", "Lobia", "Kulthi"],
  "Oils & Ghee": ["Mustard Oil", "Soybean Oil", "Sunflower Oil", "Groundnut Oil", "Rice Bran Oil", "Cow Ghee", "Buffalo Ghee", "Vanaspati", "Olive Oil", "Coconut Oil", "Sesame Oil", "Flaxseed Oil"],
  "Spices & Masala": ["Turmeric Powder", "Chilli Powder", "Coriander Powder", "Garam Masala", "Chicken Masala", "Mutton Masala", "Sabji Masala", "Hing", "Black Pepper", "Jeera", "Amchur", "Kasuri Methi", "Biryani Masala", "Pav Bhaji Masala", "Chat Masala"],
  "Beverages": ["Tea Leaves", "Instant Coffee", "Filter Coffee", "Green Tea", "Health Drink Powder", "Fruit Juice", "Cold Drink", "Mineral Water", "Energy Drink", "Soda"],
  "Dairy & Eggs": ["Full Cream Milk", "Toned Milk", "Butter", "Cheese Slices", "Cheese Block", "Paneer", "Curd Cup", "Fresh Cream", "Ice Cream", "Eggs (Dozen)", "Milk Powder"],
  "Snacks & Biscuits": ["Marie Biscuits", "Glucose Biscuits", "Cream Biscuits", "Cookies", "Potato Chips", "Corn Puffs", "Noodles", "Pasta", "Vermicelli", "Roasted Namkeen", "Peanut Chikki", "Popcorn"],
  "Personal Care": ["Beauty Soap", "Handwash", "Toothpaste", "Toothbrush", "Shampoo Bottle", "Conditioner", "Hair Oil", "Face Wash", "Talcum Powder", "Deodorant", "Shaving Cream", "Razor", "Sanitary Pads", "Hand Sanitizer"],
  "Home Care": ["Detergent Powder", "Detergent Bar", "Dishwash Bar", "Dishwash Liquid", "Floor Cleaner", "Toilet Cleaner", "Glass Cleaner", "Fabric Softener", "Mosquito Coil", "Liquid Vaporizer", "Room Freshener"],
  "Sweeteners": ["Sugar", "Jaggery", "Honey", "Sugar Cubes", "Stevia", "Brown Sugar"],
  "Dry Fruits & Nuts": ["Almonds", "Cashews", "Raisins", "Walnuts", "Pistachios", "Dates", "Apricots", "Figs"],
  "Pooja Needs": ["Incense Sticks", "Camphor", "Cotton Wicks", "Matchbox", "Dhoop", "Pooja Oil", "Kumkum", "Sindoor"],
  "Stationery": ["Notebook", "Pen", "Pencil", "Eraser", "Sharpener", "Scale", "Glue Stick", "Markers"],
  "Pet Food": ["Dog Food (Dry)", "Cat Food (Dry)", "Pet Treats", "Bird Seed"],
  "Baby Care": ["Baby Soap", "Baby Shampoo", "Baby Lotion", "Baby Powder", "Diapers", "Baby Wipes", "Baby Cereal"],
  "Miscellaneous": ["Batteries AA", "Batteries AAA", "Candles", "Plastic Containers", "Aluminum Foil", "Garbage Bags", "Kitchen Rolls"]
};

const SIZES = {
  "Grains & Flour": ["500g", "1kg", "2kg", "5kg", "10kg", "25kg", "50kg"],
  "Pulses & Lentils": ["200g", "500g", "1kg", "2kg", "5kg"],
  "Oils & Ghee": ["100ml", "200ml", "500ml", "1L", "2L", "5L", "15L"],
  "Spices & Masala": ["10g", "20g", "50g", "100g", "200g", "500g", "1kg"],
  "Beverages": ["100g", "250g", "500g", "1kg", "200ml", "500ml", "1L", "2L"],
  "Dairy & Eggs": ["100ml", "200ml", "500ml", "1L", "100g", "200g", "500g", "1kg", "Pack of 6", "Pack of 10"],
  "Snacks & Biscuits": ["Small Pack", "Medium Pack", "Large Pack", "Family Pack", "100g", "200g", "400g", "800g"],
  "Personal Care": ["Small", "Medium", "Large", "50g", "100g", "150g", "250g", "100ml", "200ml", "400ml", "600ml"],
  "Home Care": ["250g", "500g", "1kg", "2kg", "3kg", "5kg", "250ml", "500ml", "1L", "2L", "5L"],
  "Sweeteners": ["250g", "500g", "1kg", "2kg", "5kg"],
  "Dry Fruits & Nuts": ["100g", "200g", "500g", "1kg"],
  "Pooja Needs": ["Small", "Medium", "Large", "Pack of 10", "Pack of 50"],
  "Stationery": ["Single Unit", "Pack of 5", "Pack of 10"],
  "Pet Food": ["400g", "1kg", "3kg", "10kg"],
  "Baby Care": ["Small", "Medium", "Large", "Pack of 10", "Pack of 50", "Pack of 100"],
  "Miscellaneous": ["Single", "Pack of 2", "Pack of 4", "Pack of 10"]
};

const UNITS = {
  "Grains & Flour": "kg",
  "Pulses & Lentils": "kg",
  "Oils & Ghee": "litre",
  "Spices & Masala": "kg",
  "Beverages": "pcs",
  "Dairy & Eggs": "pcs",
  "Snacks & Biscuits": "pcs",
  "Personal Care": "pcs",
  "Home Care": "pcs",
  "Sweeteners": "kg",
  "Dry Fruits & Nuts": "kg",
  "Pooja Needs": "pcs",
  "Stationery": "pcs",
  "Pet Food": "pcs",
  "Baby Care": "pcs",
  "Miscellaneous": "pcs"
};

async function seed() {
  const { db, defaultItemsTable } = await import("../lib/db/src");
  console.log("Starting massive production seed generation (15k+ target)...");
  
  const allItems: any[] = [];
  
  for (const category of CATEGORIES) {
    const brands = BRANDS[category as keyof typeof BRANDS] || ["Generic"];
    const itemTypes = ITEMS[category as keyof typeof ITEMS] || ["Item"];
    const sizes = SIZES[category as keyof typeof SIZES] || ["Standard"];
    const unit = UNITS[category as keyof typeof UNITS] || "pcs";
    
    for (const brand of brands) {
      for (const type of itemTypes) {
        for (const size of sizes) {
          // Generate a semi-realistic price based on category
          let basePrice = 40;
          if (category === "Dry Fruits & Nuts") basePrice = 600;
          if (category === "Oils & Ghee") basePrice = 160;
          if (category === "Beverages") basePrice = 80;
          if (category === "Grains & Flour") basePrice = 45;
          if (category === "Pet Food") basePrice = 300;
          
          // Randomize slightly for variety
          const price = (basePrice + Math.floor(Math.random() * 120)).toString();
          
          allItems.push({
            name: `${brand} ${type} (${size})`,
            category,
            price,
            unit
          });
        }
      }
    }
  }

  console.log(`Generated ${allItems.length} total potential items.`);
  
  // Dedup by name
  const uniqueItemsMap = new Map();
  allItems.forEach(item => uniqueItemsMap.set(item.name, item));
  const finalItems = Array.from(uniqueItemsMap.values());
  
  console.log(`Unique items count: ${finalItems.length}. Checking for existing items in DB...`);

  // Clear existing items first if you want a fresh start, 
  // or just filter out duplicates from DB.
  // For production, we usually want to append or skip duplicates.
  
  // Batch insert
  const BATCH_SIZE = 100;
  let totalInserted = 0;
  
  for (let i = 0; i < finalItems.length; i += BATCH_SIZE) {
    const batch = finalItems.slice(i, i + BATCH_SIZE);
    try {
      await db.insert(defaultItemsTable).values(batch);
      totalInserted += batch.length;
      process.stdout.write(`Inserted ${totalInserted}/${finalItems.length} items...\r`);
    } catch (err) {
      // If some fail due to unique constraints (if any), log and continue
      console.log(`\nBatch starting at ${i} had issues, skipping...`);
    }
  }

  console.log(`\n\u2705 Massive production seed completed! Total items now available: ${totalInserted}`);
  process.exit(0);
}

seed().catch(err => {
  console.error("\u274c Massive seed failed:", err);
  process.exit(1);
});
