import { z } from "zod/v4";

export const ProcessOcrBody = z.object({
  imageBase64: z.string().optional(),
});

export const ProcessVoiceBody = z.object({
  text: z.string().min(1),
});
