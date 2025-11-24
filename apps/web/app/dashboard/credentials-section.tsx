'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/react';
import { generatePassword, DEFAULT_PASSWORD_OPTIONS, type PasswordOptions } from '@/lib/password-generator';
import { TagInput } from './tag-input';
import { BulkActionsBar } from './bulk-actions-bar';

interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
  userId?: string;
}

interface Credential {
  id: string;
  name: string;
  category: string;
  isPinned?: boolean | null;
  createdAt: string;
  tags: Tag[];
}

interface CredentialsSectionProps {
  credentials: Credential[] | undefined;
  tags: Tag[];
  onCreateCredential: (data: any) => void;
  onUpdateCredential: (data: any) => void;
  onDeleteCredential: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkAssignTags?: (credentialIds: string[], tagIds: string[]) => void;
}

export function CredentialsSection({
  credentials,
  tags,
  onCreateCredential,
  onUpdateCredential,
  onDeleteCredential,
  onTogglePin,
  onCreateTag,
  onBulkDelete,
  onBulkAssignTags,
}: CredentialsSectionProps) {
  const [viewingId, setViewingId] = useState<string | null>(null);
  const { data: viewedCredential } = trpc.credentials.getById.useQuery(
    { id: viewingId! },
    { enabled: !!viewingId }
  );

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);
  const [selectedCredentialIds, setSelectedCredentialIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [passwordOptions, setPasswordOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    data: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagIds = selectedTags.map((t) => t.id);

    if (editingId) {
      onUpdateCredential({ id: editingId, ...formData, tagIds });
    } else {
      onCreateCredential({ ...formData, tagIds });
    }

    // Reset form
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', category: '', data: '' });
    setSelectedTags([]);
  };

  const handleEdit = (cred: Credential) => {
    setEditingId(cred.id);
    setViewingId(cred.id);
    setSelectedTags(cred.tags || []);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this credential?')) {
      onDeleteCredential(id);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', category: '', data: '' });
    setSelectedTags([]);
  };

  const toggleFilterTag = (tagId: string) => {
    setSelectedFilterTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Bulk operations handlers
  const toggleCredentialSelection = (credentialId: string) => {
    if (selectedCredentialIds.includes(credentialId)) {
      setSelectedCredentialIds(selectedCredentialIds.filter((id) => id !== credentialId));
    } else {
      setSelectedCredentialIds([...selectedCredentialIds, credentialId]);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredCredentials?.map((cred) => cred.id) || [];
    setSelectedCredentialIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedCredentialIds([]);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedCredentialIds.length > 0) {
      onBulkDelete(selectedCredentialIds);
      setSelectedCredentialIds([]);
    }
  };

  const handleBulkAssignTags = (tagIds: string[]) => {
    if (onBulkAssignTags && selectedCredentialIds.length > 0) {
      onBulkAssignTags(selectedCredentialIds, tagIds);
      setSelectedCredentialIds([]);
    }
  };

  const handleGeneratePassword = () => {
    try {
      const password = generatePassword(passwordOptions);
      setFormData({ ...formData, data: password });
      setShowPasswordGenerator(false);
    } catch (error) {
      alert('Please select at least one character type');
    }
  };

  // Update form when viewing credential for edit
  if (editingId && viewedCredential && formData.data === '') {
    setFormData({
      name: viewedCredential.name,
      category: viewedCredential.category,
      data: viewedCredential.data,
    });
  }

  const filteredCredentials = credentials?.filter((cred) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      cred.name.toLowerCase().includes(query) ||
      cred.category.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (selectedFilterTags.length === 0) return true;

    return selectedFilterTags.some((tagId) => cred.tags?.some((t) => t.id === tagId));
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Credentials</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Add Credential
          </button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {!isAdding && onBulkDelete && onBulkAssignTags && (
        <BulkActionsBar
          selectedCount={selectedCredentialIds.length}
          totalCount={filteredCredentials?.length || 0}
          tags={tags}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkDelete={handleBulkDelete}
          onBulkAssignTags={handleBulkAssignTags}
        />
      )}

      {/* Tag Filters */}
      {tags.length > 0 && !isAdding && (
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

      {!isAdding && credentials && credentials.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search credentials by name or category..."
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

      {isAdding && (
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
                placeholder="e.g., AWS API Key, GitHub Token"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                placeholder="e.g., API Keys, Passwords, Tokens"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Credential Data (will be encrypted)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPasswordGenerator(!showPasswordGenerator)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {showPasswordGenerator ? 'Hide' : 'Generate Password'}
                </button>
              </div>

              {showPasswordGenerator && (
                <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Length: {passwordOptions.length}
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="64"
                        value={passwordOptions.length}
                        onChange={(e) => setPasswordOptions({ ...passwordOptions, length: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={passwordOptions.includeUppercase}
                          onChange={(e) => setPasswordOptions({ ...passwordOptions, includeUppercase: e.target.checked })}
                          className="mr-2"
                        />
                        Uppercase (A-Z)
                      </label>
                      <label className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={passwordOptions.includeLowercase}
                          onChange={(e) => setPasswordOptions({ ...passwordOptions, includeLowercase: e.target.checked })}
                          className="mr-2"
                        />
                        Lowercase (a-z)
                      </label>
                      <label className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={passwordOptions.includeNumbers}
                          onChange={(e) => setPasswordOptions({ ...passwordOptions, includeNumbers: e.target.checked })}
                          className="mr-2"
                        />
                        Numbers (0-9)
                      </label>
                      <label className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={passwordOptions.includeSymbols}
                          onChange={(e) => setPasswordOptions({ ...passwordOptions, includeSymbols: e.target.checked })}
                          className="mr-2"
                        />
                        Symbols (!@#$...)
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded"
                    >
                      Generate & Use
                    </button>
                  </div>
                </div>
              )}

              <textarea
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
                rows={4}
                placeholder="Enter your sensitive data here (password, API key, private key, etc.)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This data will be encrypted with AES-256-GCM before storage
              </p>
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
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {filteredCredentials && filteredCredentials.length > 0 ? (
          filteredCredentials.map((cred: any) => (
            <div
              key={cred.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <div className="flex justify-between items-start gap-3">
                {/* Checkbox for bulk selection */}
                {onBulkDelete && onBulkAssignTags && (
                  <input
                    type="checkbox"
                    checked={selectedCredentialIds.includes(cred.id)}
                    onChange={() => toggleCredentialSelection(cred.id)}
                    className="mt-1.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{cred.name}</h3>
                    {cred.isPinned && (
                      <span className="text-yellow-500" title="Pinned">
                        ⭐
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      {cred.category}
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                      Encrypted
                    </span>
                    {cred.tags && cred.tags.length > 0 && (
                      <>
                        {cred.tags.map((tag: Tag) => (
                          <span
                            key={tag.id}
                            className="inline-block px-2 py-1 text-xs font-medium text-white rounded"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onTogglePin(cred.id)}
                    className={`p-1 hover:bg-yellow-50 dark:hover:bg-yellow-900 rounded ${
                      cred.isPinned ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'
                    }`}
                    title={cred.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <svg className="w-4 h-4" fill={cred.isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewingId(cred.id)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(cred)}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cred.id)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : searchQuery || selectedFilterTags.length > 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No credentials match your search or filters
          </p>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No credentials yet. Click "Add Credential" to create your first one!
          </p>
        )}
      </div>

      {/* View Credential Modal */}
      {viewingId && viewedCredential && !editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {viewedCredential.name}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {viewedCredential.category}
                </span>
              </div>
              <button
                onClick={() => setViewingId(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Decrypted Data
                </label>
                <button
                  onClick={() => copyToClipboard(viewedCredential.data)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Copy
                </button>
              </div>
              <pre className="text-sm font-mono text-gray-900 dark:text-white whitespace-pre-wrap break-all">
                {viewedCredential.data}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingId(null)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
