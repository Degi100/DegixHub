'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, Trash2, Plus, X, Edit, Loader2, Copy, Check, StickyNote, ChevronDown, ChevronUp, Shield, Filter, Grid, List } from 'lucide-react';
import { trpc } from '@/lib/trpc/react';
import { CategorySelect } from './category-select';
import { PinModal } from './pin-modal';
import { usePinContext } from './pin-context';
import { copyToClipboard } from '@/lib/clipboard';
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
  linkedCredentialId?: string | null;
  createdAt: string;
}

interface LinkedNote {
  id: string;
  title: string;
  content: string;
}

interface CredentialOption {
  id: string;
  name: string;
}

interface SimpleLinksSectionProps {
  links: Link[] | undefined;
  onDeleteLink: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCreateLink: (data: { name: string; url: string; category: string; description?: string; favicon?: string; linkedCredentialId?: string }) => void;
  onUpdateLink: (data: { id: string; name: string; url: string; category: string; description?: string; favicon?: string; linkedCredentialId?: string }) => void;
  categories: string[];
  colorMap?: Record<string, string>;
  onAddCategory: (name: string, color?: string) => void;
  onAddNote?: (linkId: string) => void;
  notesCountByLinkId?: Record<string, number>;
  notesByLinkId?: Record<string, LinkedNote[]>;
  credentials?: CredentialOption[];
}

// Link Card Component
function LinkCard({
  link,
  onTogglePin,
  onEdit,
  onDelete,
  onAddNote,
  categoryColor,
  notesCount = 0,
  linkedNotes = [],
  linkedCredentialName,
  onCopyCredential,
}: {
  link: Link;
  onTogglePin: (id: string) => void;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
  onAddNote?: (linkId: string) => void;
  categoryColor?: string;
  notesCount?: number;
  linkedNotes?: LinkedNote[];
  linkedCredentialName?: string;
  onCopyCredential?: (credentialId: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [previewNote, setPreviewNote] = useState<LinkedNote | null>(null);
  const categoryClass = link.category.toLowerCase();
  const hasCustomColor = categoryColor && !styles[`card--${categoryClass}`];

  const handleCopyUrl = async () => {
    await copyToClipboard(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {linkedCredentialName && (
            <button
              onClick={() => link.linkedCredentialId && onCopyCredential?.(link.linkedCredentialId)}
              className={styles.credentialBadge}
              title={`Copy credential: ${linkedCredentialName}`}
            >
              <Shield style={{ width: '0.75rem', height: '0.75rem' }} />
              <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {linkedCredentialName}
              </span>
            </button>
          )}
          {notesCount > 0 && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={styles.notesBadge}
              style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              title={`${notesCount} Note${notesCount > 1 ? 's' : ''} - Click to ${showNotes ? 'hide' : 'show'}`}
            >
              <span className={styles.notesBadge}>
                <StickyNote style={{ width: '0.75rem', height: '0.75rem' }} />
                {notesCount}
                {showNotes ? (
                  <ChevronUp style={{ width: '0.75rem', height: '0.75rem', marginLeft: '0.125rem' }} />
                ) : (
                  <ChevronDown style={{ width: '0.75rem', height: '0.75rem', marginLeft: '0.125rem' }} />
                )}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Linked Notes Expandable */}
      {showNotes && linkedNotes.length > 0 && (
        <div className={styles.linkedNotes}>
          {linkedNotes.map((note) => (
            <div
              key={note.id}
              className={styles.linkedNoteItem}
              onClick={() => setPreviewNote(note)}
              style={{ cursor: 'pointer' }}
            >
              <StickyNote style={{ width: '0.875rem', height: '0.875rem', color: '#8b5cf6', flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className={styles.linkedNoteTitle}>{note.title}</div>
                <div className={styles.linkedNoteContent}>
                  {note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Preview Modal */}
      {previewNote && (
        <div className={dialogStyles.overlay} onClick={() => setPreviewNote(null)}>
          <div className={dialogStyles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={dialogStyles.dialogHeader}>
              <h3 className={dialogStyles.dialogTitle}>
                <StickyNote style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6', marginRight: '0.5rem' }} />
                {previewNote.title}
              </h3>
              <button onClick={() => setPreviewNote(null)} className={dialogStyles.closeButton}>
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
            <div style={{ padding: 'var(--space-4)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {previewNote.content}
            </div>
          </div>
        </div>
      )}

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
          onClick={handleCopyUrl}
          title={copied ? 'Copied!' : 'Copy URL'}
        >
          {copied ? (
            <Check style={{ width: '1rem', height: '1rem', color: '#22c55e' }} />
          ) : (
            <Copy style={{ width: '1rem', height: '1rem' }} />
          )}
        </Button>
        {onAddNote && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddNote(link.id)}
            title="Add Note"
          >
            <StickyNote style={{ width: '1rem', height: '1rem' }} />
          </Button>
        )}
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

export function SimpleLinksSection({ links, onDeleteLink, onTogglePin, onCreateLink, onUpdateLink, categories, colorMap = {}, onAddCategory, onAddNote, notesCountByLinkId = {}, notesByLinkId = {}, credentials = [] }: SimpleLinksSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: 'General',
    description: '',
    favicon: '',
    linkedCredentialId: '',
  });
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [copyingCredentialId, setCopyingCredentialId] = useState<string | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // PIN protection
  const { hasPin, checkPinRequired, unlock, refetchHasPin } = usePinContext();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'verify'>('verify');
  const [pendingCredentialCopy, setPendingCredentialCopy] = useState<string | null>(null);

  // Filter & View state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const filterDropdownRef = useRef<HTMLDivElement>(null);

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

  // Fetch metadata mutation
  const fetchMetadataMutation = trpc.links.fetchMetadata.useMutation();

  // Query for copying credentials
  const { data: credentialToCopy } = trpc.credentials.getById.useQuery(
    { id: copyingCredentialId! },
    { enabled: !!copyingCredentialId }
  );

  // Copy credential to clipboard when data is fetched
  if (credentialToCopy && copyingCredentialId) {
    copyToClipboard(credentialToCopy.data);
    import('sonner').then(({ toast }) => toast.success('Credential copied!'));
    setCopyingCredentialId(null);
  }

  // PIN-protected credential copy handler
  const handleCopyCredential = (credentialId: string) => {
    // If no PIN is set, show setup modal
    if (hasPin === false) {
      setPinModalMode('setup');
      setPendingCredentialCopy(credentialId);
      setShowPinModal(true);
      return;
    }

    // If PIN is required (set but not unlocked), show verify modal
    if (checkPinRequired()) {
      setPinModalMode('verify');
      setPendingCredentialCopy(credentialId);
      setShowPinModal(true);
      return;
    }

    // PIN unlocked, copy credential
    setCopyingCredentialId(credentialId);
  };

  const handlePinSuccess = (rememberSession: boolean) => {
    setShowPinModal(false);
    unlock(rememberSession);
    refetchHasPin();

    // Execute pending credential copy
    if (pendingCredentialCopy) {
      setCopyingCredentialId(pendingCredentialCopy);
      setPendingCredentialCopy(null);
    }
  };

  // Helper to get credential name by ID
  const getCredentialName = (credentialId: string | null | undefined) => {
    if (!credentialId) return undefined;
    return credentials.find(c => c.id === credentialId)?.name;
  };

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

  // Filter links by selected categories
  const filteredLinks = selectedCategories.length > 0
    ? links?.filter(l => selectedCategories.includes(l.category))
    : links;

  const pinnedLinks = filteredLinks?.filter(l => l.isPinned).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unpinnedLinks = filteredLinks?.filter(l => !l.isPinned).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Get unique categories from links
  const usedCategories = [...new Set(links?.map(l => l.category) || [])];

  // Toggle category filter
  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingLink) {
      onUpdateLink({ id: editingLink, ...formData });
    } else {
      onCreateLink({ ...formData });
    }

    setFormData({ name: '', url: '', category: 'General', description: '', favicon: '', linkedCredentialId: '' });
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
      linkedCredentialId: link.linkedCredentialId || '',
    });
    setShowDialog(true);
  };

  const handleCancel = () => {
    setShowDialog(false);
    setEditingLink(null);
    setFormData({ name: '', url: '', category: 'General', description: '', favicon: '', linkedCredentialId: '' });
  };

  return (
    <div className={dialogStyles.section}>
      <div className={dialogStyles.sectionHeader}>
        <h2 className={dialogStyles.sectionTitle}>Links</h2>
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
            Add Link
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
              {credentials.length > 0 && (
                <div className={dialogStyles.formField}>
                  <label className={dialogStyles.label}>Linked Credential</label>
                  <select
                    value={formData.linkedCredentialId}
                    onChange={(e) => setFormData({ ...formData, linkedCredentialId: e.target.value })}
                    className={dialogStyles.input}
                  >
                    <option value="">-- No Credential --</option>
                    {credentials.map((cred) => (
                      <option key={cred.id} value={cred.id}>{cred.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={dialogStyles.formActions}>
                <Button type="submit" style={{ flex: 1 }}>{editingLink ? 'Update' : 'Add'} Link</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredLinks && filteredLinks.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--text-sm)',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)' }}></th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Link</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Beschreibung</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Kategorie</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredLinks].sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }).map((link) => (
                <tr
                  key={link.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    background: link.isPinned ? 'var(--color-muted)' : 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-muted)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = link.isPinned ? 'var(--color-muted)' : 'transparent'}
                >
                  <td style={{ padding: 'var(--space-2)' }}>
                    {link.favicon ? (
                      <img src={link.favicon} alt="" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                    ) : (
                      <ExternalLink style={{ width: '16px', height: '16px', color: 'var(--color-muted-foreground)' }} />
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 500 }}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {link.name}
                    </a>
                  </td>
                  <td style={{ padding: 'var(--space-3)', color: 'var(--color-muted-foreground)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.description || '-'}
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)',
                      background: colorMap[link.category] || 'var(--color-muted)',
                      color: colorMap[link.category] ? 'white' : 'var(--color-foreground)',
                    }}>
                      {link.category}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                      <Button variant="ghost" size="icon" onClick={() => onTogglePin(link.id)} title={link.isPinned ? 'Unpin' : 'Pin'}>
                        <Star style={{ width: '14px', height: '14px', fill: link.isPinned ? '#eab308' : 'none', color: link.isPinned ? '#eab308' : 'currentColor' }} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(link)} title="Edit">
                        <Edit style={{ width: '14px', height: '14px' }} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => window.open(link.url, '_blank')} title="Open">
                        <ExternalLink style={{ width: '14px', height: '14px' }} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this link?')) onDeleteLink(link.id); }} title="Delete">
                        <Trash2 style={{ width: '14px', height: '14px', color: 'var(--color-destructive)' }} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View - Pinned Links */}
      {viewMode === 'grid' && pinnedLinks && pinnedLinks.length > 0 && (
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
                onAddNote={onAddNote}
                categoryColor={colorMap[link.category]}
                notesCount={notesCountByLinkId[link.id] || 0}
                linkedNotes={notesByLinkId[link.id] || []}
                linkedCredentialName={getCredentialName(link.linkedCredentialId)}
                onCopyCredential={handleCopyCredential}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grid View - Regular Links */}
      {viewMode === 'grid' && unpinnedLinks && unpinnedLinks.length > 0 && (
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
                onAddNote={onAddNote}
                categoryColor={colorMap[link.category]}
                notesCount={notesCountByLinkId[link.id] || 0}
                linkedNotes={notesByLinkId[link.id] || []}
                linkedCredentialName={getCredentialName(link.linkedCredentialId)}
                onCopyCredential={handleCopyCredential}
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

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingCredentialCopy(null);
        }}
        onSuccess={handlePinSuccess}
        mode={pinModalMode}
      />
    </div>
  );
}
