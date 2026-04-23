import { z } from "zod";

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid("Catégorie requise"),
  amount: z.number().int().positive("Le plafond doit être > 0"), // centimes
  period: z.enum(["monthly", "annual"]).default("monthly"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
    }),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
