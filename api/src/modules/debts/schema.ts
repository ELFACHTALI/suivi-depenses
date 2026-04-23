import { z } from "zod";

export const createDebtSchema = z.object({
  creditor: z.string().min(1).max(100),
  totalAmount: z.number().int().positive(),     // centimes
  remainingAmount: z.number().int().positive(),  // centimes
  monthlyPayment: z.number().int().positive(),   // centimes
  interestRate: z.number().min(0).max(100).default(0), // % annuel
  currency: z.string().length(3).default("MAD"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateDebtSchema = createDebtSchema.partial();

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
