import { z } from "zod/v4";

export const CreateCustomerBody = z.object({
  name: z.string().min(1),
  phone: z.string().nullish(),
  email: z.string().email().nullish(),
  address: z.string().nullish(),
  notes: z.string().nullish(),
});

export const UpdateCustomerBody = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullish(),
  email: z.string().email().nullish(),
  address: z.string().nullish(),
  notes: z.string().nullish(),
});
