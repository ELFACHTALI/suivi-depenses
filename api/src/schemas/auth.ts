import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Mot de passe trop court (8 caractères minimum)")
    .max(100),
  name: z.string().min(2, "Nom trop court").max(100),
  referenceCurrency: z.string().length(3).default("MAD"),
  timezone: z.string().default("Africa/Casablanca"),
  language: z.enum(["fr", "en"]).default("fr"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  totpToken: z.string().length(6).optional(),
});

export const totpVerifySchema = z.object({
  token: z.string().length(6, "Code TOTP à 6 chiffres"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
