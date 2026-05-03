import { z } from "zod/v4";

export const UpdateSettingsBody = z.object({
  shopName: z.string().min(1).optional(),
  themeColor: z.string().optional(),
  upiId: z.string().optional(),
  language: z.enum(["en", "hi"]).optional(),
  ownerWhatsapp: z.string().optional(),
});
