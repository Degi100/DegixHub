'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, Trash2, Plus, X, Edit, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/react';
import { CategorySelect } from './category-select';
import styles from './card.module.css';
import dialogStyles from './dialog.module.css';

interface Link {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string | null;
  favicon?: string | null;
  isPinned?: boolean | null;
  createdAt: string;
}

interface SimpleLinksSectionProps {
  links: Link[] | undefined;
  onDeleteLink: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCreateLink: (data: { name: string; url: string; category: string; description?: string; favicon?: string }) => void;
  onUpdateLink: (data: { id: string; name: string; url: string; category: string; description?: string; favicon?: string }) => void;
  categories: string[];
  colorMap?: Record<string, string>;
  onAddCategory: (name: string, color?: string) => void;
}

// Link Card Component
function LinkCard({
  link,
  onTogglePin,
  onEdit,
  onDelete,
  categoryColor,
}: {
  link: Link;
  onTogglePin: (id: string) => void;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
  categoryColor?: string;
}) {
  const categoryClass = link.category.toLowerCase();
  const hasCustomColor = categoryColor && !styles[`card--${categoryClass}`];

  return (
    <div
      className={`${styles.card} ${!hasCustomColor ? styles[`card--${categoryClass}`] : ''}`}
      style={hasCustomColor ? {
        '--custom-category-color': categoryColor,
      } as React.CSSProperties : undefined}
      onMouseEnter={(e) => {
        if (hasCustomColor) {
          (e.currentTarget as HTMLElement).style.borderColor = `${categoryColor}80`;
        }
      }}
      onMouseLeave={(e) => {
        if (hasCustomColor) {
          (e.currentTarget as HTMLElement).style.borderColor = '';
        }
      }}
    >
      {/* Category Badge & Pin */}
      <div className={styles.cardHeader}>
        <span
          className={`${styles.categoryBadge} ${!hasCustomColor ? styles[`categoryBadge--${categoryClass}`] : ''}`}
          style={hasCustomColor ? {
            backgroundColor: `${categoryColor}20`,
            color: categoryColor,
            borderColor: `${categoryColor}40`,
          } : undefined}
        >
          {link.category}
        </span>
        {link.isPinned && (
          <Star className={styles.pinIcon} />
        )}
      </div>

      {/* Content */}
      <div className={`${styles.cardContent} ${styles.linkContent}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {link.favicon && (
            <img
              src={link.favicon}
              alt=""
              style={{ width: '1rem', height: '1rem', borderRadius: '2px', flexShrink: 0 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <h4 className={styles.cardTitle}>{link.name}</h4>
        </div>
        {link.description && (
          <p className={styles.cardDescription}>{link.description}</p>
        )}
        <p className={styles.cardUrl}>{link.url}</p>
        <p className={styles.cardDate}>
          {new Date(link.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>
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

export function SimpleLinksSection({ links, onDeleteLink, onTogglePin, onCreateLink, onUpdateLink, categories, colorMap = {}, onAddCategory }: SimpleLinksSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: 'General',
    description: '',
    favicon: '',
  });
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch metadata mutation
  const fetchMetadataMutation = trpc.links.fetchMetadata.useMutation();

  // Auto-fetch metadata when URL changes (with debounce)
  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, url }));

    // Clear previous timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Only fetch if URL looks valid and we're not editing
    if (!editingLink && url.length > 10 && (url.startsWith('http://') || url.startsWith('https://'))) {
      fetchTimeoutRef.current = setTimeout(async () => {
        setIsFetchingMeta(true);
        try {
          const metadata = await fetchMetadataMutation.mutateAsync({ url });
          // Only fill if fields are empty
          setFormData(prev => ({
            ...prev,
            name: prev.name || metadata.title || '',
            description: prev.description || metadata.description || '',
            favicon: metadata.favicon || '',
          }));
        } catch (e) {
          // Ignore fetch errors
        }
        setIsFetchingMeta(false);
      }, 800);
    }
  };

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

    setFormData({ name: '', url: '', category: 'General', description: '', favicon: '' });
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
      favicon: link.favicon || '',
    });
    setShowDialog(true);
  };

  const handleCancel = () => {
    setShowDialog(false);
    setEditingLink(null);
    setFormData({ name: '', url: '', category: 'General', description: '', favicon: '' });
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
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className={dialogStyles.input}
                    placeholder="https://example.com"
                  />
                  {isFetchingMeta && (
                    <Loader2 style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '1rem',
                      height: '1rem',
                      animation: 'spin 1s linear infinite',
                      color: 'var(--color-muted-foreground)'
                    }} />
                  )}
                </div>
                {!editingLink && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginTop: '4px' }}>
                    Name & Description werden automatisch gefetcht
                  </p>
                )}
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
                categoryColor={colorMap[link.category]}
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
                categoryColor={colorMap[link.category]}
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
