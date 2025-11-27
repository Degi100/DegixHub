import { eq, and } from 'drizzle-orm';
import { parse, object, string, optional } from 'valibot';
import { generateId } from 'lucia';
import { db } from '../../db';
import { categories } from '../../db/schema';
import { router, protectedProcedure } from '../index';

// Default categories that are always available
const DEFAULT_CATEGORIES = [
  'General',
  'Work',
  'Personal',
  'Development',
  'Design',
  'Documentation',
  'Social',
  'Entertainment',
  'Shopping',
  'News',
  'Ideas',
  'Projects',
  'Todo',
];

export const categoriesRouter = router({
  // Get all categories for the current user (including defaults)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    // Combine default categories with user-created ones
    const customCategoryNames = userCategories.map((c) => c.name);
    const allCategoryNames = [
      ...DEFAULT_CATEGORIES,
      ...customCategoryNames.filter((name) => !DEFAULT_CATEGORIES.includes(name)),
    ];

    return {
      categories: allCategoryNames.sort(),
      customCategories: userCategories,
    };
  }),

  // Create a new category
  create: protectedProcedure
    .input((input) =>
      parse(
        object({
          name: string(),
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
      if (DEFAULT_CATEGORIES.includes(input.name)) {
        return { id: 'default', name: input.name, type: 'all', userId, createdAt: new Date() };
      }

      const id = generateId(15);
      const newCategory = {
        id,
        userId,
        name: input.name,
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
