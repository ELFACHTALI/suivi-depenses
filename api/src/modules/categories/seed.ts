import { db } from "../../db/index.ts";
import { categories } from "../../db/schema/index.ts";
import { isNull, eq } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
  // ── Dépenses ────────────────────────────────────────────────────────────────
  { name: "Alimentation", type: "expense", icon: "🛒", color: "#16a34a" },
  { name: "Restaurants", type: "expense", icon: "🍽️", color: "#ea580c" },
  { name: "Transport", type: "expense", icon: "🚗", color: "#2563eb" },
  { name: "Abonnements", type: "expense", icon: "🔄", color: "#7c3aed" },
  { name: "Logiciels & Pro", type: "expense", icon: "💻", color: "#0891b2" },
  { name: "Loisirs & Sorties", type: "expense", icon: "🎭", color: "#db2777" },
  { name: "Santé", type: "expense", icon: "💊", color: "#dc2626" },
  { name: "Vêtements", type: "expense", icon: "👗", color: "#d97706" },
  { name: "Éducation", type: "expense", icon: "📚", color: "#059669" },
  { name: "Maison", type: "expense", icon: "🏠", color: "#64748b" },
  { name: "Épargne", type: "expense", icon: "💰", color: "#0d9488" },
  { name: "Cadeaux", type: "expense", icon: "🎁", color: "#e11d48" },
  { name: "Voyages", type: "expense", icon: "✈️", color: "#0284c7" },
  { name: "Assurances", type: "expense", icon: "🛡️", color: "#4f46e5" },
  { name: "Taxes & Impôts", type: "expense", icon: "🏛️", color: "#78716c" },
  { name: "Autres dépenses", type: "expense", icon: "📦", color: "#9ca3af" },
  // ── Revenus ─────────────────────────────────────────────────────────────────
  { name: "Salaire", type: "income", icon: "💼", color: "#16a34a" },
  { name: "Freelance", type: "income", icon: "🖥️", color: "#059669" },
  { name: "Investissements", type: "income", icon: "📈", color: "#0891b2" },
  { name: "Loyers perçus", type: "income", icon: "🏘️", color: "#7c3aed" },
  { name: "Remboursements", type: "income", icon: "↩️", color: "#d97706" },
  { name: "Autres revenus", type: "income", icon: "💵", color: "#9ca3af" },
] as const;

export async function seedDefaultCategories(): Promise<void> {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(isNull(categories.userId))
    .limit(1);

  if (existing.length > 0) return; // déjà seedé

  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, isDefault: true, userId: null }))
  );

  console.log(`[Seed] ${DEFAULT_CATEGORIES.length} catégories système insérées`);
}
