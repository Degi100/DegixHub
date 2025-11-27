'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, Trash2, Plus, X, Edit } from 'lucide-react';
import { CategorySelect } from './category-select';
import styles from './card.module.css';
import dialogStyles from './dialog.module.css';

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
  categories: string[];
  onAddCategory: (name: string) => void;
}

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
  const categoryClass = link.category.toLowerCase();

  return (
    <div className={`${styles.card} ${styles[`card--${categoryClass}`]}`}>
      {/* Category Badge & Pin */}
      <div className={styles.cardHeader}>
        <span className={`${styles.categoryBadge} ${styles[`categoryBadge--${categoryClass}`]}`}>
          {link.category}
        </span>
        {link.isPinned && (
          <Star className={styles.pinIcon} />
        )}
      </div>

      {/* Content */}
      <div className={`${styles.cardContent} ${styles.linkContent}`}>
        <h4 className={styles.cardTitle}>{link.name}</h4>
        {link.description && (
          <p className={styles.cardDescription}>{link.description}</p>
        )}
        <p className={styles.cardUrl}>{link.url}</p>
      </div>

      {/* Actions */}
      <div className={styles.cardActions}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onTogglePin(link.id)}
          title={link.isPinned ? 'Unpin' : 'Pin'}
        >
          <Star style={{
            width: '1rem',
            height: '1rem',
            fill: link.isPinned ? '#facc15' : 'none',
            color: link.isPinned ? '#facc15' : 'currentColor'
          }} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(link)}
          title="Edit"
        >
          <Edit style={{ width: '1rem', height: '1rem' }} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.open(link.url, '_blank')}
          title="Open link"
        >
          <ExternalLink style={{ width: '1rem', height: '1rem' }} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm('Delete this link?')) {
              onDelete(link.id);
            }
          }}
          title="Delete"
        >
          <Trash2 style={{ width: '1rem', height: '1rem', color: 'var(--color-destructive)' }} />
        </Button>
      </div>
    </div>
  );
}

export function SimpleLinksSection({ links, onDeleteLink, onTogglePin, onCreateLink, onUpdateLink, categories, onAddCategory }: SimpleLinksSectionProps) {
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
    <div className={dialogStyles.section}>
      <div className={dialogStyles.sectionHeader}>
        <h2 className={dialogStyles.sectionTitle}>Links</h2>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
          Add Link
        </Button>
      </div>

      {/* Add/Edit Link Dialog */}
      {showDialog && (
        <div className={dialogStyles.overlay}>
          <div className={dialogStyles.dialog}>
            <div className={dialogStyles.dialogHeader}>
              <h3 className={dialogStyles.dialogTitle}>{editingLink ? 'Edit Link' : 'Add New Link'}</h3>
              <button onClick={handleCancel} className={dialogStyles.closeButton}>
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={dialogStyles.form}>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={dialogStyles.input}
                />
              </div>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>URL *</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className={dialogStyles.input}
                />
              </div>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Category</label>
                <CategorySelect
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  categories={categories}
                  onAddCategory={onAddCategory}
                />
              </div>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`${dialogStyles.input} ${dialogStyles.textarea}`}
                />
              </div>
              <div className={dialogStyles.formActions}>
                <Button type="submit" style={{ flex: 1 }}>{editingLink ? 'Update' : 'Add'} Link</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pinned Links */}
      {pinnedLinks && pinnedLinks.length > 0 && (
        <div className={dialogStyles.cardSection}>
          <h3 className={dialogStyles.subsectionTitle}>
            <Star className={styles.pinIcon} />
            Pinned ({pinnedLinks.length})
          </h3>
          <div className={dialogStyles.grid}>
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
        <div className={dialogStyles.cardSection}>
          {pinnedLinks && pinnedLinks.length > 0 && (
            <h3 className={dialogStyles.subsectionTitle}>
              All Links ({unpinnedLinks.length})
            </h3>
          )}
          <div className={dialogStyles.grid}>
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
        <div className={dialogStyles.emptyState}>
          <div className={dialogStyles.emptyIcon}>
            <ExternalLink style={{ width: '1.5rem', height: '1.5rem', color: 'var(--color-muted-foreground)' }} />
          </div>
          <h3 className={dialogStyles.emptyTitle}>No links yet</h3>
          <p className={dialogStyles.emptyDescription}>
            Get started by adding your first link
          </p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
            Add Link
          </Button>
        </div>
      )}
    </div>
  );
}
