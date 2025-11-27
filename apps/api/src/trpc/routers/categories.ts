import { eq, and } from 'drizzle-orm';
import { parse, object, string, optional } from 'valibot';
import { generateId } from 'lucia';
import { db } from '../../db';
import { categories } from '../../db/schema';
import { router, protectedProcedure } from '../index';

// Default categories with their colors
const DEFAULT_CATEGORIES: { name: string; color: string }[] = [
  { name: 'General', color: '#6b7280' },
  { name: 'Work', color: '#3b82f6' },
  { name: 'Personal', color: '#8b5cf6' },
  { name: 'Development', color: '#10b981' },
  { name: 'Design', color: '#f59e0b' },
  { name: 'Documentation', color: '#6366f1' },
  { name: 'Social', color: '#ec4899' },
  { name: 'Entertainment', color: '#f97316' },
  { name: 'Shopping', color: '#14b8a6' },
  { name: 'News', color: '#ef4444' },
  { name: 'Ideas', color: '#a855f7' },
  { name: 'Projects', color: '#0ea5e9' },
  { name: 'Todo', color: '#84cc16' },
];

export const categoriesRouter = router({
  // Get all categories for the current user (including defaults)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    // Build category list with colors
    const defaultCategoryNames = DEFAULT_CATEGORIES.map((c) => c.name);
    const customCategoryNames = userCategories
      .filter((c) => !defaultCategoryNames.includes(c.name))
      .map((c) => c.name);

    // Create color map: default colors + custom category colors
    const colorMap: Record<string, string> = {};
    DEFAULT_CATEGORIES.forEach((c) => {
      colorMap[c.name] = c.color;
    });
    userCategories.forEach((c) => {
      colorMap[c.name] = c.color;
    });

    const allCategoryNames = [...defaultCategoryNames, ...customCategoryNames].sort();

    return {
      categories: allCategoryNames,
      colorMap,
      customCategories: userCategories,
    };
  }),

  // Create a new category
  create: protectedProcedure
    .input((input) =>
      parse(
        object({
          name: string(),
          color: optional(string()),
          type: optional(string()), // 'link', 'credential', 'note', 'all'
        }),
        input
      )
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if category already exists (case-insensitive)
      const existing = await db
        .select()
        .from(categories)
        .where(and(eq(categories.userId, userId), eq(categories.name, input.name)));

      if (existing.length > 0) {
        return existing[0];
      }

      // Check if it's a default category
      const defaultCat = DEFAULT_CATEGORIES.find((c) => c.name === input.name);
      if (defaultCat) {
        return { id: 'default', name: input.name, color: defaultCat.color, type: 'all', userId, createdAt: new Date() };
      }

      const id = generateId(15);
      const newCategory = {
        id,
        userId,
        name: input.name,
        color: input.color || '#6b7280',
        type: input.type || 'all',
        createdAt: new Date(),
      };

      await db.insert(categories).values(newCategory);

      return newCategory;
    }),

  // Delete a category
  delete: protectedProcedure
    .input((input) =>
      parse(
        object({
          id: string(),
        }),
        input
      )
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      await db
        .delete(categories)
        .where(and(eq(categories.id, input.id), eq(categories.userId, userId)));

      return { success: true };
    }),
});
