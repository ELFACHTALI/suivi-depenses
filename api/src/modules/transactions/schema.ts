import { z } from "zod";

const today = () => new Date().toISOString().slice(0, 10);

export const createTransactionSchema = z
  .object({
    title: z.string().min(1, "Titre requis").max(200),
    // RG-01 : montant > 0 (en centimes)
    amount: z.number().int().positive("Le montant doit être supérieur à 0"),
    currency: z.string().length(3).default("MAD"),
    fxRate: z.string().default("1"),
    type: z.enum(["expense", "income", "transfer"]),
    accountId: z.string().uuid("Compte requis"),
    categoryId: z.string().uuid("Catégorie requise"),
    // RG-01 : date ≤ aujourd'hui
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD attendu")
      .refine((d) => d <= today(), "La date ne peut pas être dans le futur"),
    note: z.string().max(500).optional(),
    fiscalMarker: z.boolean().default(false),
    // Pour les virements : UUID du compte de destination
    toAccountId: z.string().uuid().optional(),
  })
  .refine(
    (d) => d.type !== "transfer" || !!d.toAccountId,
    { message: "toAccountId requis pour un virement", path: ["toAccountId"] }
  );

export const updateTransactionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  amount: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  categoryId: z.string().uuid().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => d <= today())
    .optional(),
  note: z.string().max(500).optional(),
  fiscalMarker: z.boolean().optional(),
});

export const listTransactionsSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(["expense", "income", "transfer", "recurring"]).optional(),
  categoryId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsSchema>;
