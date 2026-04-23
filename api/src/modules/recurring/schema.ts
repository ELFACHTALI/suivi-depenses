import { z } from "zod";

export const createRecurringSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().int().positive(),
  currency: z.string().length(3).default("MAD"),
  type: z.enum(["expense", "income"]),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  nextDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const updateRecurringSchema = createRecurringSchema.partial();

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
