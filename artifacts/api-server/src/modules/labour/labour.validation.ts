import { z } from "zod/v4";

export const CreateLabourBody = z.object({
  name: z.string().min(1),
  phone: z.string().nullish(),
  role: z.string().nullish(),
  salaryPerMonth: z.number().positive(),
});

export const UpdateLabourBody = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullish(),
  role: z.string().nullish(),
  salaryPerMonth: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export const MarkAttendanceBody = z.object({
  labourId: z.string(),
  date: z.string(),
  status: z.enum(["present", "absent", "half"]),
});
