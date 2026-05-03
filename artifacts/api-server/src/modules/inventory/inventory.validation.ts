import { z } from "zod/v4";
import { UNITS } from "../../constants";

export const CreateItemBody = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().min(0),
  unit: z.enum(UNITS),
  lowStockThreshold: z.number().min(0).optional(),
});

export const UpdateItemBody = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  stock: z.number().min(0).optional(),
  unit: z.enum(UNITS).optional(),
  lowStockThreshold: z.number().min(0).optional(),
});

export const AddDefaultItemsBody = z.object({
  items: z.array(z.object({
    defaultItemId: z.string().optional(),
    name: z.string().min(1),
    category: z.string().min(1),
    price: z.number().positive(),
    stock: z.number().min(0),
    unit: z.string().min(1),
    lowStockThreshold: z.number().min(0).optional(),
  })).min(1, "Select at least one item"),
});

export const ImportExcelBody = z.object({
  mode: z.enum(["create", "update"]),
});
