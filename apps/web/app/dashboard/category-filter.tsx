'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  onClearFilters: () => void;
  colorMap?: Record<string, string>;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onToggleCategory,
  onClearFilters,
  colorMap = {},
}: CategoryFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <Button
        size="sm"
        variant={selectedCategories.length > 0 ? 'primary' : 'outline'}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Filter style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
        Filter {selectedCategories.length > 0 && `(${selectedCategories.length})`}
      </Button>
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 'var(--space-2)',
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          minWidth: '180px',
          zIndex: 50,
          padding: 'var(--space-2)',
        }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', padding: 'var(--space-2)', fontWeight: 600 }}>
            Kategorien
          </div>
          {categories.map(category => (
            <label
              key={category}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-muted)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => onToggleCategory(category)}
                style={{ accentColor: colorMap[category] || 'var(--color-primary)' }}
              />
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: colorMap[category] || 'var(--color-muted-foreground)',
              }} />
              <span style={{ fontSize: 'var(--text-sm)' }}>{category}</span>
            </label>
          ))}
          {selectedCategories.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearFilters}
              style={{ width: '100%', marginTop: 'var(--space-2)' }}
            >
              Filter zurücksetzen
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface ActiveFiltersProps {
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  colorMap?: Record<string, string>;
}

export function ActiveFilters({ selectedCategories, onToggleCategory, colorMap = {} }: ActiveFiltersProps) {
  if (selectedCategories.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}>
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted-foreground)' }}>Filter:</span>
      {selectedCategories.map(category => (
        <span
          key={category}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: '2px 8px',
            background: colorMap[category] || 'var(--color-muted)',
            color: 'white',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
          }}
        >
          {category}
          <X
            style={{ width: '12px', height: '12px', cursor: 'pointer' }}
            onClick={() => onToggleCategory(category)}
          />
        </span>
      ))}
    </div>
  );
}
