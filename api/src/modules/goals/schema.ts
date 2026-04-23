import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  targetAmount: z.number().int().positive(), // centimes
  currency: z.string().length(3).default("MAD"),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  emoji: z.string().max(10).default("🎯"),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(["in_progress", "achieved", "archived"]).optional(),
});

export const contributeSchema = z.object({
  amount: z.number().int().positive(), // centimes à ajouter
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
