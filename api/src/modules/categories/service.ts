import { db } from "../../db/index.ts";
import { categories } from "../../db/schema/index.ts";
import { eq, and, isNull, or } from "drizzle-orm";
import { AppError } from "../../middleware/errorHandler.ts";
import type { CreateCategoryInput } from "./schema.ts";

// Retourne les catégories système + celles de l'utilisateur
export async function listCategories(userId: string) {
  return db
    .select()
    .from(categories)
    .where(
      and(
        isNull(categories.deletedAt),
        or(isNull(categories.userId), eq(categories.userId, userId))
      )
    )
    .orderBy(categories.type, categories.name);
}

export async function createCategory(userId: string, data: CreateCategoryInput) {
  const [category] = await db
    .insert(categories)
    .values({ ...data, userId })
    .returning();
  return category;
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  data: Partial<CreateCategoryInput>
) {
  const [existing] = await db
    .select({ userId: categories.userId })
    .from(categories)
    .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)))
    .limit(1);

  if (!existing) throw new AppError(404, "Catégorie introuvable");
  if (existing.userId !== userId) {
    throw new AppError(403, "Impossible de modifier une catégorie système");
  }

  const [updated] = await db
    .update(categories)
    .set(data)
    .where(eq(categories.id, categoryId))
    .returning();

  return updated;
}

export async function deleteCategory(userId: string, categoryId: string) {
  const [existing] = await db
    .select({ userId: categories.userId })
    .from(categories)
    .where(and(eq(categories.id, categoryId), isNull(categories.deletedAt)))
    .limit(1);

  if (!existing) throw new AppError(404, "Catégorie introuvable");
  if (existing.userId !== userId) {
    throw new AppError(403, "Impossible de supprimer une catégorie système");
  }

  await db
    .update(categories)
    .set({ deletedAt: new Date() })
    .where(eq(categories.id, categoryId));
}
