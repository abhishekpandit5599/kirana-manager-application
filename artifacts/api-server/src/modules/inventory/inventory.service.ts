import { inventoryRepository } from "./inventory.repository";
import { AppError } from "../../middlewares/error.middleware";
import ExcelJS from "exceljs";

function formatItem(item: any) {
  const stock = parseFloat(item.stock);
  const threshold = parseFloat(item.lowStockThreshold);
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    price: parseFloat(item.price),
    stock,
    unit: item.unit,
    lowStockThreshold: threshold,
    isLowStock: stock <= threshold,
    createdAt: item.createdAt.toISOString(),
  };
}

export const inventoryService = {
  async listItems(shopId: string, category?: string, lowStock?: string) {
    let items = await inventoryRepository.findAllByShop(shopId);
    if (category) {
      items = items.filter((i) => i.category.toLowerCase() === category.toLowerCase());
    }
    const formatted = items.map(formatItem);
    if (lowStock === "true") return formatted.filter((i) => i.isLowStock);
    return formatted;
  },

  async getItem(id: string, shopId: string) {
    const item = await inventoryRepository.findById(id, shopId);
    if (!item) throw new AppError(404, "Item not found");
    return formatItem(item);
  },

  async createItem(shopId: string, data: any) {
    const item = await inventoryRepository.create({
      name: data.name,
      category: data.category,
      price: data.price.toString(),
      stock: data.stock.toString(),
      unit: data.unit,
      lowStockThreshold: (data.lowStockThreshold ?? 5).toString(),
      shopId,
    });
    return formatItem(item);
  },

  async updateItem(id: string, shopId: string, data: any) {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.price !== undefined) updateData.price = data.price.toString();
    if (data.stock !== undefined) updateData.stock = data.stock.toString();
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold.toString();

    const item = await inventoryRepository.update(id, shopId, updateData);
    if (!item) throw new AppError(404, "Item not found");
    return formatItem(item);
  },

  async deleteItem(id: string, shopId: string) {
    const item = await inventoryRepository.deleteById(id, shopId);
    if (!item) throw new AppError(404, "Item not found");
  },

  // Default items
  async getDefaultItems() {
    const items = await inventoryRepository.getAllDefaultItems();
    return items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      price: parseFloat(i.price),
      unit: i.unit,
    }));
  },

  async addDefaultItems(shopId: string, items: any[]) {
    const toInsert = items.map((item) => ({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      stock: item.stock.toString(),
      unit: item.unit,
      lowStockThreshold: (item.lowStockThreshold ?? 5).toString(),
      shopId,
    }));
    const created = await inventoryRepository.bulkCreate(toInsert);
    return { added: created.length, message: `${created.length} items added to inventory` };
  },

  // Excel
  async generateExcelTemplate() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Inventory");
    ws.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Category", key: "category", width: 20 },
      { header: "Price", key: "price", width: 12 },
      { header: "Stock", key: "stock", width: 12 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Low Stock Threshold", key: "lowStockThreshold", width: 20 },
    ];
    // Add sample row
    ws.addRow({ name: "Basmati Rice", category: "Grains", price: 80, stock: 50, unit: "kg", lowStockThreshold: 10 });
    ws.addRow({ name: "Sugar", category: "Sweeteners", price: 45, stock: 40, unit: "kg", lowStockThreshold: 10 });
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    return wb;
  },

  async importExcel(shopId: string, buffer: Buffer, mode: "create" | "update") {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    const ws = wb.getWorksheet("Inventory") ?? wb.worksheets[0];
    if (!ws) throw new AppError(400, "No worksheet found in Excel file");

    const items: any[] = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const name = row.getCell(1).value?.toString()?.trim();
      if (!name) return;
      items.push({
        name,
        category: row.getCell(2).value?.toString()?.trim() || "General",
        price: (Number(row.getCell(3).value) || 0).toString(),
        stock: (Number(row.getCell(4).value) || 0).toString(),
        unit: row.getCell(5).value?.toString()?.trim() || "pcs",
        lowStockThreshold: (Number(row.getCell(6).value) || 5).toString(),
        shopId,
      });
    });

    if (items.length === 0) throw new AppError(400, "No valid items found in Excel file");

    if (mode === "create") {
      await inventoryRepository.deleteAllByShop(shopId);
      await inventoryRepository.bulkCreate(items);
      return { imported: items.length, mode, message: `Replaced inventory with ${items.length} items` };
    }

    // Update mode: upsert by name
    let updated = 0;
    let inserted = 0;
    for (const item of items) {
      const existing = await inventoryRepository.findByName(item.name, shopId);
      if (existing) {
        await inventoryRepository.update(existing.id, shopId, {
          category: item.category,
          price: item.price,
          stock: item.stock,
          unit: item.unit,
          lowStockThreshold: item.lowStockThreshold,
        });
        updated++;
      } else {
        await inventoryRepository.create(item);
        inserted++;
      }
    }
    return { updated, inserted, mode, message: `Updated ${updated}, inserted ${inserted} items` };
  },

  async exportExcel(shopId: string) {
    const items = await inventoryRepository.findAllByShop(shopId);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Inventory");
    ws.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Category", key: "category", width: 20 },
      { header: "Price", key: "price", width: 12 },
      { header: "Stock", key: "stock", width: 12 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "Low Stock Threshold", key: "lowStockThreshold", width: 20 },
    ];
    for (const item of items) {
      ws.addRow({
        name: item.name,
        category: item.category,
        price: parseFloat(item.price),
        stock: parseFloat(item.stock),
        unit: item.unit,
        lowStockThreshold: parseFloat(item.lowStockThreshold),
      });
    }
    const headerRow = ws.getRow(1);
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    return wb;
  },
};
