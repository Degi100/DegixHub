'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import dialogStyles from './dialog.module.css';

// Default categories - same as backend
const DEFAULT_CATEGORIES = [
  'Design',
  'Development',
  'Documentation',
  'Entertainment',
  'General',
  'Ideas',
  'News',
  'Personal',
  'Projects',
  'Shopping',
  'Social',
  'Todo',
  'Work',
];

// Preset colors for color picker
const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#14b8a6', // teal
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#6b7280', // gray
];

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  colorMap?: Record<string, string>;
  onAddCategory: (name: string, color?: string) => Promise<void> | void;
  className?: string;
}

export function CategorySelect({
  value,
  onChange,
  categories,
  colorMap = {},
  onAddCategory,
  className,
}: CategorySelectProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

  // Use backend categories if available, otherwise use defaults
  // Include current value if it's not in the list (e.g., newly added category)
  const baseCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const displayCategories = value && !baseCategories.includes(value)
    ? [...baseCategories, value].sort()
    : baseCategories;

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      const trimmedName = newCategoryName.trim();
      const color = newCategoryColor;
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
      setShowAddDialog(false);
      // Send to backend first (will trigger refetch), then select the category
      await onAddCategory(trimmedName, color);
      onChange(trimmedName);
    }
  };

  const handleCancel = () => {
    setShowAddDialog(false);
    setNewCategoryName('');
    setNewCategoryColor('#3b82f6');
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className || dialogStyles.input}
        style={{ flex: 1 }}
      >
        {displayCategories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setShowAddDialog(true)}
        title="Add new category"
        style={{ flexShrink: 0 }}
      >
        <Plus style={{ width: '1rem', height: '1rem' }} />
      </Button>

      {/* Add Category Dialog */}
      {showAddDialog && (
        <div className={dialogStyles.overlay} onClick={handleCancel}>
          <div
            className={dialogStyles.dialog}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px' }}
          >
            <div className={dialogStyles.dialogHeader}>
              <h3 className={dialogStyles.dialogTitle}>Add New Category</h3>
              <button onClick={handleCancel} className={dialogStyles.closeButton}>
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
            <div className={dialogStyles.form}>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className={dialogStyles.input}
                  placeholder="Enter category name"
                  autoFocus
                />
              </div>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Color</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: color,
                        border: newCategoryColor === color ? '3px solid var(--color-foreground)' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'transform 0.1s',
                      }}
                      title={color}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    style={{
                      width: '2.5rem',
                      height: '2rem',
                      padding: 0,
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted-foreground)' }}>
                    Custom color
                  </span>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2)',
                backgroundColor: 'var(--color-muted)',
                borderRadius: 'var(--radius-md)',
                marginTop: 'var(--space-2)'
              }}>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-muted-foreground)'
                }}>Preview:</span>
                <span style={{
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: `${newCategoryColor}20`,
                  color: newCategoryColor,
                  border: `1px solid ${newCategoryColor}40`,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                }}>
                  {newCategoryName || 'Category'}
                </span>
              </div>
              <div className={dialogStyles.formActions}>
                <Button type="button" onClick={handleAddCategory} style={{ flex: 1 }}>
                  Add Category
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
