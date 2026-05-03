import { z } from "zod/v4";

export const CreateInvoiceBody = z.object({
  customerName: z.string().nullish(),
  customerPhone: z.string().nullish(),
  customerId: z.string().nullish(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().positive(),
  })).min(1),
  paymentMethod: z.enum(["cash", "upi"]),
  status: z.enum(["paid", "unpaid"]).optional(),
}).refine((data) => {
  // If one customer field is provided, the other becomes required
  if (data.customerName && !data.customerPhone) return false;
  if (data.customerPhone && !data.customerName) return false;
  return true;
}, { message: "If customer name is provided, phone is required (and vice versa)" });

export const ListInvoicesQuery = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  customerId: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
});
