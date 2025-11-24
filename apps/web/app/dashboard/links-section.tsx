'use client';

import { useState } from 'react';
import { TagInput } from './tag-input';
import { BulkActionsBar } from './bulk-actions-bar';

interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
  userId?: string;
}

interface Link {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string | null;
  isPinned?: boolean | null;
  createdAt: string;
  userId?: string;
  tags: Tag[];
}

interface LinksSectionProps {
  links: Link[] | undefined;
  tags: Tag[];
  onCreateLink: (data: any) => void;
  onUpdateLink: (data: any) => void;
  onDeleteLink: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkAssignTags?: (linkIds: string[], tagIds: string[]) => void;
  isLoading?: boolean;
}

export function LinksSection({
  links,
  tags,
  onCreateLink,
  onUpdateLink,
  onDeleteLink,
  onTogglePin,
  onCreateTag,
  onBulkDelete,
  onBulkAssignTags,
  isLoading,
}: LinksSectionProps) {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: 'General',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagIds = selectedTags.map((t) => t.id);

    if (editingLink) {
      onUpdateLink({ id: editingLink, ...formData, tagIds });
    } else {
      onCreateLink({ ...formData, tagIds });
    }

    // Reset form
    setIsAddingLink(false);
    setEditingLink(null);
    setFormData({ name: '', url: '', category: 'General', description: '' });
    setSelectedTags([]);
  };

  const handleEdit = (link: Link) => {
    setEditingLink(link.id);
    setFormData({
      name: link.name,
      url: link.url,
      category: link.category,
      description: link.description || '',
    });
    setSelectedTags(link.tags || []);
    setIsAddingLink(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this link?')) {
      onDeleteLink(id);
    }
  };

  const handleCancel = () => {
    setIsAddingLink(false);
    setEditingLink(null);
    setFormData({ name: '', url: '', category: 'General', description: '' });
    setSelectedTags([]);
  };

  // Bulk operations handlers
  const toggleLinkSelection = (linkId: string) => {
    if (selectedLinkIds.includes(linkId)) {
      setSelectedLinkIds(selectedLinkIds.filter((id) => id !== linkId));
    } else {
      setSelectedLinkIds([...selectedLinkIds, linkId]);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredLinks?.map((link) => link.id) || [];
    setSelectedLinkIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedLinkIds([]);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedLinkIds.length > 0) {
      onBulkDelete(selectedLinkIds);
      setSelectedLinkIds([]);
    }
  };

  const handleBulkAssignTags = (tagIds: string[]) => {
    if (onBulkAssignTags && selectedLinkIds.length > 0) {
      onBulkAssignTags(selectedLinkIds, tagIds);
      setSelectedLinkIds([]);
    }
  };

  // Filter links by search query and selected tags
  const filteredLinks = links?.filter((link) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      link.name.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query) ||
      link.category.toLowerCase().includes(query) ||
      (link.description && link.description.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (selectedFilterTags.length === 0) return true;

    return selectedFilterTags.some((tagId) => link.tags?.some((t) => t.id === tagId));
  });

  const toggleFilterTag = (tagId: string) => {
    setSelectedFilterTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Links</h2>
        {!isAddingLink && (
          <button
            onClick={() => setIsAddingLink(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Add Link
          </button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {!isAddingLink && onBulkDelete && onBulkAssignTags && (
        <BulkActionsBar
          selectedCount={selectedLinkIds.length}
          totalCount={filteredLinks?.length || 0}
          tags={tags}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkDelete={handleBulkDelete}
          onBulkAssignTags={handleBulkAssignTags}
        />
      )}

      {/* Tag Filters */}
      {tags.length > 0 && !isAddingLink && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleFilterTag(tag.id)}
                className={`px-3 py-1 rounded-full text-sm text-white transition-opacity ${
                  selectedFilterTags.includes(tag.id) ? 'opacity-100 ring-2 ring-white' : 'opacity-60'
                }`}
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </button>
            ))}
            {selectedFilterTags.length > 0 && (
              <button
                onClick={() => setSelectedFilterTags([])}
                className="px-3 py-1 rounded-full text-sm bg-gray-600 text-white hover:bg-gray-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      {!isAddingLink && links && links.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search links by name, URL, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {isAddingLink && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="General">General</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Documentation">Documentation</option>
                <option value="Social">Social</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Shopping">Shopping</option>
                <option value="News">News</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <TagInput
                selectedTags={selectedTags}
                availableTags={tags}
                onTagsChange={setSelectedTags}
                onCreateTag={onCreateTag}
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                {editingLink ? 'Update' : 'Add'} Link
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Links List */}
      <div className="space-y-3">
        {filteredLinks && filteredLinks.length > 0 ? (
          filteredLinks.map((link) => (
            <div
              key={link.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <div className="flex justify-between items-start gap-3">
                {/* Checkbox for bulk selection */}
                {onBulkDelete && onBulkAssignTags && (
                  <input
                    type="checkbox"
                    checked={selectedLinkIds.includes(link.id)}
                    onChange={() => toggleLinkSelection(link.id)}
                    className="mt-1.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {link.name}
                    </h3>
                    {link.isPinned && (
                      <span className="text-yellow-500" title="Pinned">
                        ⭐
                      </span>
                    )}
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {link.url}
                  </a>
                  {link.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {link.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      {link.category}
                    </span>
                    {link.tags && link.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {link.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-block px-2 py-1 text-xs font-medium text-white rounded"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => onTogglePin(link.id)}
                    className={`p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900 rounded ${
                      link.isPinned ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'
                    }`}
                    title={link.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <svg className="w-5 h-5" fill={link.isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleEdit(link)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            {searchQuery || selectedFilterTags.length > 0
              ? 'No links match your search or filters'
              : 'No links yet. Add your first link!'}
          </p>
        )}
      </div>
    </div>
  );
}
