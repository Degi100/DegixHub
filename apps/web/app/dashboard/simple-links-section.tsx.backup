'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, Trash2, Plus, X, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Link {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string | null;
  isPinned?: boolean | null;
  createdAt: string;
}

interface SimpleLinksSectionProps {
  links: Link[] | undefined;
  onDeleteLink: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCreateLink: (data: { name: string; url: string; category: string; description?: string }) => void;
  onUpdateLink: (data: { id: string; name: string; url: string; category: string; description?: string }) => void;
}

// Category color mapping
const categoryColors: Record<string, string> = {
  General: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  Work: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Personal: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  Development: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  Design: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  Documentation: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  Social: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  Entertainment: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  Shopping: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  News: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
};

// Category accent colors for card borders (with !important to override global border-color)
const categoryAccents: Record<string, string> = {
  General: 'hover:!border-gray-500/50',
  Work: 'hover:!border-blue-500/50',
  Personal: 'hover:!border-purple-500/50',
  Development: 'hover:!border-green-500/50',
  Design: 'hover:!border-pink-500/50',
  Documentation: 'hover:!border-yellow-500/50',
  Social: 'hover:!border-cyan-500/50',
  Entertainment: 'hover:!border-orange-500/50',
  Shopping: 'hover:!border-red-500/50',
  News: 'hover:!border-indigo-500/50',
};

// Link Card Component
function LinkCard({
  link,
  onTogglePin,
  onEdit,
  onDelete,
}: {
  link: Link;
  onTogglePin: (id: string) => void;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
}) {
  const categoryColor = categoryColors[link.category] || categoryColors.General;
  const categoryAccent = categoryAccents[link.category] || categoryAccents.General;

  return (
    <div className={cn(
      'group relative bg-card border-2 border-border rounded-lg p-4 hover:shadow-xl transition-all duration-200',
      categoryAccent
    )}>
      {/* Category Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold border', categoryColor)}>
          {link.category}
        </span>
        {link.isPinned && (
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        )}
      </div>

      {/* Content */}
      <div className="mb-4 min-h-[80px]">
        <h4 className="font-bold text-base mb-2 line-clamp-1 group-hover:text-primary transition-colors">{link.name}</h4>
        {link.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{link.description}</p>
        )}
        <p className="text-xs text-muted-foreground/60 truncate font-mono bg-muted/30 px-2 py-1 rounded">{link.url}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onTogglePin(link.id)}
          title={link.isPinned ? 'Unpin' : 'Pin'}
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
          onClick={() => onEdit(link)}
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.open(link.url, '_blank')}
          title="Open link"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (confirm('Delete this link?')) {
              onDelete(link.id);
            }
          }}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SimpleLinksSection({ links, onDeleteLink, onTogglePin, onCreateLink, onUpdateLink }: SimpleLinksSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: 'General',
    description: '',
  });

  const pinnedLinks = links?.filter(l => l.isPinned).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unpinnedLinks = links?.filter(l => !l.isPinned).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingLink) {
      onUpdateLink({ id: editingLink, ...formData });
    } else {
      onCreateLink({ ...formData });
    }

    setFormData({ name: '', url: '', category: 'General', description: '' });
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
    setShowDialog(true);
  };

  const handleCancel = () => {
    setShowDialog(false);
    setEditingLink(null);
    setFormData({ name: '', url: '', category: 'General', description: '' });
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
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">{editingLink ? 'Update' : 'Add'} Link</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pinned Links */}
      {pinnedLinks && pinnedLinks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            Pinned ({pinnedLinks.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onTogglePin={onTogglePin}
                onEdit={handleEdit}
                onDelete={onDeleteLink}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Links */}
      {unpinnedLinks && unpinnedLinks.length > 0 && (
        <div className="space-y-3">
          {pinnedLinks && pinnedLinks.length > 0 && (
            <h3 className="text-sm font-semibold text-muted-foreground">
              All Links ({unpinnedLinks.length})
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpinnedLinks.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                onTogglePin={onTogglePin}
                onEdit={handleEdit}
                onDelete={onDeleteLink}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!links || links.length === 0) && (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <ExternalLink className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No links yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by adding your first link
          </p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>
      )}
    </div>
  );
}
