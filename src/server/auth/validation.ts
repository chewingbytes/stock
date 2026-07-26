import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(1).max(80).optional(),
});

export type Credentials = z.infer<typeof credentialsSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
