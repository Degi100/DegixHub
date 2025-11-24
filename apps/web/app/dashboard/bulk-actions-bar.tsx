'use client';

import { useState } from 'react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  tags: Tag[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkAssignTags: (tagIds: string[]) => void;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  tags,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkAssignTags,
}: BulkActionsBarProps) {
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  if (selectedCount === 0) {
    return null;
  }

  const handleAssignTags = () => {
    if (selectedTagIds.length > 0) {
      onBulkAssignTags(selectedTagIds);
      setSelectedTagIds([]);
      setShowTagPicker(false);
    }
  };

  const toggleTagSelection = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedCount} selected
          </span>

          {selectedCount < totalCount ? (
            <button
              onClick={onSelectAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select all {totalCount}
            </button>
          ) : (
            <button
              onClick={onDeselectAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Deselect all
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Tag Assignment */}
          <div className="relative">
            <button
              onClick={() => setShowTagPicker(!showTagPicker)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Add Tags
            </button>

            {showTagPicker && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-3">
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select tags to assign
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {tags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag.id)}
                          onChange={() => toggleTagSelection(tag.id)}
                          className="rounded"
                        />
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {tag.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleAssignTags}
                    disabled={selectedTagIds.length === 0}
                    className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => {
                      setShowTagPicker(false);
                      setSelectedTagIds([]);
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Delete */}
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to delete ${selectedCount} items?`)) {
                onBulkDelete();
              }
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete ({selectedCount})
          </button>
        </div>
      </div>
    </div>
  );
}
