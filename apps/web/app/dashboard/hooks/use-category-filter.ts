'use client';

import { useState, useEffect } from 'react';

export function useCategoryFilter<T extends { category: string }>(
  items: T[] | undefined,
  initialDisplayCount = 20
) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [displayCount, setDisplayCount] = useState(initialDisplayCount);

  // Get unique categories from items
  const usedCategories = [...new Set(items?.map(item => item.category) || [])];

  // Toggle category filter
  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Clear all filters
  const clearFilters = () => setSelectedCategories([]);

  // Filter items by selected categories
  const filteredItems = selectedCategories.length > 0
    ? items?.filter(item => selectedCategories.includes(item.category))
    : items;

  // Reset display count when filter changes
  useEffect(() => {
    setDisplayCount(initialDisplayCount);
  }, [selectedCategories, initialDisplayCount]);

  // Load more function
  const loadMore = (count = 20) => setDisplayCount(prev => prev + count);

  return {
    selectedCategories,
    toggleCategoryFilter,
    clearFilters,
    filteredItems,
    usedCategories,
    displayCount,
    setDisplayCount,
    loadMore,
  };
}
