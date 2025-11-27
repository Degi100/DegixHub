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

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  onAddCategory: (name: string) => Promise<void> | void;
  className?: string;
}

export function CategorySelect({
  value,
  onChange,
  categories,
  onAddCategory,
  className,
}: CategorySelectProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Use backend categories if available, otherwise use defaults
  // Include current value if it's not in the list (e.g., newly added category)
  const baseCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const displayCategories = value && !baseCategories.includes(value)
    ? [...baseCategories, value].sort()
    : baseCategories;

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      const trimmedName = newCategoryName.trim();
      // Select the new category immediately (it will show because of the value check above)
      onChange(trimmedName);
      setNewCategoryName('');
      setShowAddDialog(false);
      // Send to backend (will trigger refetch)
      await onAddCategory(trimmedName);
    }
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
        <div className={dialogStyles.overlay} onClick={() => setShowAddDialog(false)}>
          <div
            className={dialogStyles.dialog}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px' }}
          >
            <div className={dialogStyles.dialogHeader}>
              <h3 className={dialogStyles.dialogTitle}>Add New Category</h3>
              <button onClick={() => setShowAddDialog(false)} className={dialogStyles.closeButton}>
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
              <div className={dialogStyles.formActions}>
                <Button type="button" onClick={handleAddCategory} style={{ flex: 1 }}>
                  Add Category
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
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
