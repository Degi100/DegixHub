'use client';

import { useState, useEffect } from 'react';

export type ViewMode = 'grid' | 'table';

export function useViewMode(key: string, defaultMode: ViewMode = 'grid') {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(`viewMode-${key}`) as ViewMode) || defaultMode;
    }
    return defaultMode;
  });

  useEffect(() => {
    localStorage.setItem(`viewMode-${key}`, viewMode);
  }, [key, viewMode]);

  return [viewMode, setViewMode] as const;
}
