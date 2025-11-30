'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Plus, X, Edit, Trash2, Link as LinkIcon, Key, Filter, Grid, List, StickyNote } from 'lucide-react';
import { CategorySelect } from './category-select';
import styles from './card.module.css';
import dialogStyles from './dialog.module.css';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean | null;
  linkedLinkId?: string | null;
  linkedCredentialId?: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface Props {
  notes: Note[];
  searchQuery: string;
  links?: Array<{ id: string; name: string; url: string }>;
  credentials?: Array<{ id: string; name: string }>;
  categories: string[];
  colorMap?: Record<string, string>;
  onAddCategory: (name: string, color?: string) => void;
  onCreate: (note: {
    title: string;
    content: string;
    category: string;
    linkedLinkId?: string;
    linkedCredentialId?: string;
  }) => void;
  onUpdate: (id: string, note: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  pendingLinkId?: string | null;
  pendingCredentialId?: string | null;
  onClearPending?: () => void;
}

// Note Card Component
function NoteCard({
  note,
  onTogglePin,
  onEdit,
  onDelete,
  links,
  credentials,
  categoryColor,
}: {
  note: Note;
  onTogglePin: (id: string) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  links: Array<{ id: string; name: string; url: string }>;
  credentials: Array<{ id: string; name: string }>;
  categoryColor?: string;
}) {
  const linkedLink = links.find(l => l.id === note.linkedLinkId);
  const linkedCredential = credentials.find(c => c.id === note.linkedCredentialId);
  const categoryClass = note.category.toLowerCase();
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
          {note.category}
        </span>
      </div>

      {/* Content */}
      <div className={styles.cardContent}>
        <h4 className={styles.cardTitle}>{note.title}</h4>
        <p className={styles.cardDescription}>
          {note.content.slice(0, 150)}{note.content.length > 150 ? '...' : ''}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          {linkedLink && (
            <a
              href={linkedLink.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={`Link: ${linkedLink.name}`}
            >
              <LinkIcon style={{ width: '0.875rem', height: '0.875rem' }} />
              <span>{linkedLink.name}</span>
            </a>
          )}
          {linkedCredential && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-muted-foreground)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title={`Credential: ${linkedCredential.name}`}
            >
              <Key style={{ width: '0.875rem', height: '0.875rem' }} />
              <span>{linkedCredential.name}</span>
            </span>
          )}
          {note.tags.map((tag) => (
            <span
              key={tag.id}
              style={{
                fontSize: 'var(--text-xs)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: tag.color,
                color: 'white'
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginTop: 'var(--space-2)' }}>
          Updated {new Date(note.updatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div className={styles.cardActions}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onTogglePin(note.id)}
          title={note.isPinned ? 'Unpin' : 'Pin'}
        >
          <Star style={{
            width: '1rem',
            height: '1rem',
            fill: note.isPinned ? '#facc15' : 'none',
            color: note.isPinned ? '#facc15' : 'currentColor'
          }} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(note)}
          title="Edit"
        >
          <Edit style={{ width: '1rem', height: '1rem' }} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm('Delete this note?')) {
              onDelete(note.id);
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

export function NotesSection({
  notes,
  searchQuery,
  links = [],
  credentials = [],
  categories,
  colorMap = {},
  onAddCategory,
  onCreate,
  onUpdate,
  onDelete,
  onTogglePin,
  pendingLinkId,
  pendingCredentialId,
  onClearPending,
}: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    linkedLinkId: '',
    linkedCredentialId: '',
  });

  // Filter & View state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Progressive loading state
  const INITIAL_DISPLAY_COUNT = 20;
  const LOAD_MORE_COUNT = 20;
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown]);

  // Get unique categories from notes
  const usedCategories = [...new Set(notes?.map(n => n.category) || [])];

  // Toggle category filter
  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Auto-open dialog when coming from Link/Credential
  const [pendingHandled, setPendingHandled] = useState(false);
  if ((pendingLinkId || pendingCredentialId) && !pendingHandled && !showDialog) {
    const linkedLink = pendingLinkId ? links.find(l => l.id === pendingLinkId) : null;
    const linkedCredential = pendingCredentialId ? credentials.find(c => c.id === pendingCredentialId) : null;

    setFormData({
      title: linkedLink ? `Note for ${linkedLink.name}` : linkedCredential ? `Note for ${linkedCredential.name}` : '',
      content: '',
      category: 'General',
      linkedLinkId: pendingLinkId || '',
      linkedCredentialId: pendingCredentialId || '',
    });
    setShowDialog(true);
    setPendingHandled(true);
  }

  // Reset pending handled when dialog closes
  const handleCancel = () => {
    setShowDialog(false);
    setEditingNote(null);
    setFormData({ title: '', content: '', category: 'General', linkedLinkId: '', linkedCredentialId: '' });
    setPendingHandled(false);
    onClearPending?.();
  };

  // Filter notes by search and category
  const filteredNotes = notes.filter((note) => {
    const matchesSearch = searchQuery
      ? note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategories.length > 0
      ? selectedCategories.includes(note.category)
      : true;
    return matchesSearch && matchesCategory;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Progressive loading: slice unpinned notes for display
  const displayedUnpinnedNotes = unpinnedNotes.slice(0, displayCount);
  const hasMoreToLoad = unpinnedNotes.length > displayCount;
  const remainingCount = unpinnedNotes.length - displayCount;

  // Reset display count when filter changes
  useEffect(() => {
    setDisplayCount(INITIAL_DISPLAY_COUNT);
  }, [selectedCategories, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    if (editingNote) {
      onUpdate(editingNote, formData);
    } else {
      onCreate({
        ...formData,
        linkedLinkId: formData.linkedLinkId || undefined,
        linkedCredentialId: formData.linkedCredentialId || undefined,
      });
    }

    handleCancel();
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note.id);
    setFormData({
      title: note.title,
      content: note.content,
      category: note.category,
      linkedLinkId: note.linkedLinkId || '',
      linkedCredentialId: note.linkedCredentialId || '',
    });
    setShowDialog(true);
  };

  return (
    <div className={dialogStyles.section}>
      <div className={dialogStyles.sectionHeader}>
        <h2 className={dialogStyles.sectionTitle}>Notes</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('grid')}
              style={{ borderRadius: 0, padding: '0.5rem' }}
              title="Grid View"
            >
              <Grid style={{ width: '1rem', height: '1rem' }} />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'table' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('table')}
              style={{ borderRadius: 0, padding: '0.5rem' }}
              title="Table View"
            >
              <List style={{ width: '1rem', height: '1rem' }} />
            </Button>
          </div>

          {/* Category Filter */}
          <div style={{ position: 'relative' }} ref={filterDropdownRef}>
            <Button
              size="sm"
              variant={selectedCategories.length > 0 ? 'primary' : 'outline'}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Filter style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
              Filter {selectedCategories.length > 0 && `(${selectedCategories.length})`}
            </Button>
            {showFilterDropdown && (
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
                {usedCategories.map(category => (
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
                      onChange={() => toggleCategoryFilter(category)}
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
                    onClick={() => setSelectedCategories([])}
                    style={{ width: '100%', marginTop: 'var(--space-2)' }}
                  >
                    Filter zurücksetzen
                  </Button>
                )}
              </div>
            )}
          </div>

          <Button size="sm" onClick={() => setShowDialog(true)}>
            <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
            Add Note
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {selectedCategories.length > 0 && (
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
                onClick={() => toggleCategoryFilter(category)}
              />
            </span>
          ))}
        </div>
      )}

      {/* Add/Edit Note Dialog */}
      {showDialog && (
        <div className={dialogStyles.overlay}>
          <div className={dialogStyles.dialog}>
            <div className={dialogStyles.dialogHeader}>
              <h3 className={dialogStyles.dialogTitle}>{editingNote ? 'Edit Note' : 'Add New Note'}</h3>
              <button onClick={handleCancel} className={dialogStyles.closeButton}>
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={dialogStyles.form}>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={dialogStyles.input}
                  placeholder="Note title"
                />
              </div>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Content *</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className={`${dialogStyles.input} ${dialogStyles.textarea}`}
                  placeholder="Note content (Markdown supported)"
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
                <label className={dialogStyles.label}>Link to Link (optional)</label>
                <select
                  value={formData.linkedLinkId}
                  onChange={(e) => setFormData({ ...formData, linkedLinkId: e.target.value })}
                  className={dialogStyles.input}
                >
                  <option value="">-- None --</option>
                  {links.map((link) => (
                    <option key={link.id} value={link.id}>
                      {link.name} ({link.url})
                    </option>
                  ))}
                </select>
              </div>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Link to Credential (optional)</label>
                <select
                  value={formData.linkedCredentialId}
                  onChange={(e) => setFormData({ ...formData, linkedCredentialId: e.target.value })}
                  className={dialogStyles.input}
                >
                  <option value="">-- None --</option>
                  {credentials.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={dialogStyles.formActions}>
                <Button type="submit" style={{ flex: 1 }}>{editingNote ? 'Update' : 'Add'} Note</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredNotes.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--text-sm)',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Titel</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Inhalt</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Kategorie</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Verknüpft</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {/* Pinned notes first, then displayed unpinned notes */}
              {[...pinnedNotes, ...displayedUnpinnedNotes].map((note) => {
                const linkedLink = links.find(l => l.id === note.linkedLinkId);
                const linkedCredential = credentials.find(c => c.id === note.linkedCredentialId);
                return (
                  <tr
                    key={note.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      background: note.isPinned ? 'var(--color-muted)' : 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-muted)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = note.isPinned ? 'var(--color-muted)' : 'transparent'}
                  >
                    <td style={{ padding: 'var(--space-3)', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <StickyNote style={{ width: '14px', height: '14px', color: 'var(--color-muted-foreground)' }} />
                        {note.title}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--color-muted-foreground)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.content.substring(0, 50)}{note.content.length > 50 ? '...' : ''}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        background: colorMap[note.category] || 'var(--color-muted)',
                        color: colorMap[note.category] ? 'white' : 'var(--color-foreground)',
                      }}>
                        {note.category}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {linkedLink && (
                          <span style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-muted-foreground)' }}>
                            <LinkIcon style={{ width: '12px', height: '12px' }} />
                            {linkedLink.name}
                          </span>
                        )}
                        {linkedCredential && (
                          <span style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-muted-foreground)' }}>
                            <Key style={{ width: '12px', height: '12px' }} />
                            {linkedCredential.name}
                          </span>
                        )}
                        {!linkedLink && !linkedCredential && <span style={{ color: 'var(--color-muted-foreground)' }}>-</span>}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" size="icon" onClick={() => onTogglePin(note.id)} title={note.isPinned ? 'Unpin' : 'Pin'}>
                          <Star style={{ width: '14px', height: '14px', fill: note.isPinned ? '#eab308' : 'none', color: note.isPinned ? '#eab308' : 'currentColor' }} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(note)} title="Edit">
                          <Edit style={{ width: '14px', height: '14px' }} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this note?')) onDelete(note.id); }} title="Delete">
                          <Trash2 style={{ width: '14px', height: '14px', color: 'var(--color-destructive)' }} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Load More Button for Table View */}
          {hasMoreToLoad && (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
              <Button
                variant="outline"
                onClick={() => setDisplayCount(prev => prev + LOAD_MORE_COUNT)}
              >
                Load More ({remainingCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Grid View - Pinned Notes */}
      {viewMode === 'grid' && pinnedNotes.length > 0 && (
        <div className={dialogStyles.cardSection}>
          <h3 className={dialogStyles.subsectionTitle}>
            <Star className={styles.pinIcon} />
            Pinned ({pinnedNotes.length})
          </h3>
          <div className={dialogStyles.grid}>
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onTogglePin={onTogglePin}
                onEdit={handleEdit}
                onDelete={onDelete}
                links={links}
                credentials={credentials}
                categoryColor={colorMap[note.category]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grid View - All Notes */}
      {viewMode === 'grid' && (
        <div className={dialogStyles.cardSection}>
          <h3 className={dialogStyles.subsectionTitle}>
            {pinnedNotes.length > 0 ? 'All Notes' : 'Notes'} ({unpinnedNotes.length})
          </h3>
          {unpinnedNotes.length === 0 ? (
            <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-4)' }}>
              {searchQuery ? 'No notes found' : 'No notes yet. Create your first note!'}
            </p>
          ) : (
            <>
              <div className={dialogStyles.grid}>
                {displayedUnpinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onTogglePin={onTogglePin}
                    onEdit={handleEdit}
                    onDelete={onDelete}
                    links={links}
                    credentials={credentials}
                    categoryColor={colorMap[note.category]}
                  />
                ))}
              </div>
              {/* Load More Button */}
              {hasMoreToLoad && (
                <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                  <Button
                    variant="outline"
                    onClick={() => setDisplayCount(prev => prev + LOAD_MORE_COUNT)}
                  >
                    Load More ({remainingCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
