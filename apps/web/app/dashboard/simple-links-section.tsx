'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, Trash2, Plus, X, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TagInput } from './tag-input';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Link {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string | null;
  isPinned?: boolean | null;
  createdAt: string;
  tags: Tag[];
}

interface SimpleLinksSectionProps {
  links: Link[] | undefined;
  tags: Tag[];
  onDeleteLink: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCreateLink: (data: { name: string; url: string; category: string; description?: string; tagIds?: string[] }) => void;
  onUpdateLink: (data: { id: string; name: string; url: string; category: string; description?: string; tagIds?: string[] }) => void;
  onCreateTag: (name: string, color: string) => void;
}

export function SimpleLinksSection({ links, tags, onDeleteLink, onTogglePin, onCreateLink, onUpdateLink, onCreateTag }: SimpleLinksSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: 'General',
    description: '',
  });

  const sortedLinks = links?.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagIds = selectedTags.map((t) => t.id);

    if (editingLink) {
      onUpdateLink({ id: editingLink, ...formData, tagIds });
    } else {
      onCreateLink({ ...formData, tagIds });
    }

    setFormData({ name: '', url: '', category: 'General', description: '' });
    setSelectedTags([]);
    setShowDialog(false);
    setEditingLink(null);
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
    setShowDialog(true);
  };

  const handleCancel = () => {
    setShowDialog(false);
    setEditingLink(null);
    setFormData({ name: '', url: '', category: 'General', description: '' });
    setSelectedTags([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Links</h2>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </div>

      {/* Add/Edit Link Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">{editingLink ? 'Edit Link' : 'Add New Link'}</h3>
              <button onClick={handleCancel} className="hover:bg-muted rounded p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/50 rounded-md border border-border focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL *</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/50 rounded-md border border-border focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/50 rounded-md border border-border focus:outline-none focus:border-primary"
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
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-muted/50 rounded-md border border-border focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <TagInput
                  selectedTags={selectedTags}
                  availableTags={tags}
                  onTagsChange={setSelectedTags}
                  onCreateTag={onCreateTag}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">{editingLink ? 'Update' : 'Add'} Link</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-sm">Name</th>
              <th className="text-left p-3 font-medium text-sm">Category</th>
              <th className="text-left p-3 font-medium text-sm">Tags</th>
              <th className="text-right p-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedLinks && sortedLinks.length > 0 ? (
              sortedLinks.map((link) => (
                <tr key={link.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {link.isPinned && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                      <div>
                        <div className="font-medium">{link.name}</div>
                        {link.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {link.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-muted-foreground">{link.category}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {link.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-block px-2 py-0.5 text-xs rounded"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onTogglePin(link.id)}
                      >
                        <Star
                          className={cn(
                            'h-4 w-4',
                            link.isPinned ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(link)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm('Delete this link?')) {
                            onDeleteLink(link.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No links yet. Click "Add Link" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
