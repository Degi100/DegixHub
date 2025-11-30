'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Eye, Copy, Trash2, Plus, Shield, X, Edit, StickyNote, ChevronDown, ChevronUp, Filter, Grid, List, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/react';
import { CategorySelect } from './category-select';
import { PinModal } from './pin-modal';
import { usePinContext } from './pin-context';
import { copyToClipboard, copySecureToClipboard } from '@/lib/clipboard';
import { DraggableGrid } from './draggable-grid';
import styles from './card.module.css';
import dialogStyles from './dialog.module.css';

interface Credential {
  id: string;
  name: string;
  category: string;
  isPinned?: boolean | null;
  pinOrder?: number | null;
  createdAt: string;
}

interface LinkedNote {
  id: string;
  title: string;
  content: string;
}

interface SimpleCredentialsSectionProps {
  credentials: Credential[] | undefined;
  onDeleteCredential: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCreateCredential: (data: { name: string; data: string; category: string }) => void;
  onUpdateCredential: (data: { id: string; name: string; data: string; category: string }) => void;
  categories: string[];
  colorMap?: Record<string, string>;
  onAddCategory: (name: string, color?: string) => void;
  onAddNote?: (credentialId: string) => void;
  notesCountByCredentialId?: Record<string, number>;
  notesByCredentialId?: Record<string, LinkedNote[]>;
}

// Credential Card Component
function CredentialCard({
  credential,
  onTogglePin,
  onView,
  onEdit,
  onDelete,
  onAddNote,
  categoryColor,
  notesCount = 0,
  linkedNotes = [],
}: {
  credential: Credential;
  onTogglePin: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNote?: (credentialId: string) => void;
  categoryColor?: string;
  notesCount?: number;
  linkedNotes?: LinkedNote[];
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [previewNote, setPreviewNote] = useState<LinkedNote | null>(null);
  const categoryClass = credential.category.toLowerCase();
  const hasCustomColor = categoryColor && !styles[`card--${categoryClass}`];

  return (
    <div
      className={`${styles.card} ${!hasCustomColor ? styles[`card--${categoryClass}`] : ''} ${credential.isPinned ? styles.cardPinned : ''}`}
      style={hasCustomColor ? {
        '--custom-category-color': categoryColor,
      } as React.CSSProperties : undefined}
      onMouseEnter={(e) => {
        if (hasCustomColor && !credential.isPinned) {
          (e.currentTarget as HTMLElement).style.borderColor = `${categoryColor}80`;
        }
      }}
      onMouseLeave={(e) => {
        if (hasCustomColor && !credential.isPinned) {
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
          {credential.category}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {notesCount > 0 && (
            <button
              onClick={() => setShowNotes(!showNotes)}
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
          <div className={styles.securityBadge}>
            <Shield />
            <span>AES-256</span>
          </div>
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
      <div className={`${styles.cardContent} ${styles.credentialContent}`}>
        <h4 className={styles.cardTitle}>{credential.name}</h4>
        <p className={styles.passwordDots}>••••••••</p>
      </div>

      {/* Actions & Date */}
      <div className={styles.cardActions} style={{ marginTop: 'auto' }}>
        <span className={styles.cardDate} style={{ marginRight: 'auto' }}>
          Erstellt {new Date(credential.createdAt).toLocaleDateString('de-DE')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onTogglePin(credential.id)}
          title={credential.isPinned ? 'Unpin' : 'Pin'}
        >
          <Star style={{
            width: '1rem',
            height: '1rem',
            fill: credential.isPinned ? '#facc15' : 'none',
            color: credential.isPinned ? '#facc15' : 'currentColor'
          }} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(credential.id)}
          title="View credential"
        >
          <Eye style={{ width: '1rem', height: '1rem' }} />
        </Button>
        {onAddNote && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAddNote(credential.id)}
            title="Add Note"
          >
            <StickyNote style={{ width: '1rem', height: '1rem' }} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(credential.id)}
          title="Edit"
        >
          <Edit style={{ width: '1rem', height: '1rem' }} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (confirm('Delete this credential?')) {
              onDelete(credential.id);
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

export function SimpleCredentialsSection({
  credentials,
  onDeleteCredential,
  onTogglePin,
  onCreateCredential,
  onUpdateCredential,
  categories,
  colorMap = {},
  onAddCategory,
  onAddNote,
  notesCountByCredentialId = {},
  notesByCredentialId = {},
}: SimpleCredentialsSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    data: '',
    category: 'General',
  });

  // PIN protection
  const { hasPin, checkPinRequired, unlock, refetchHasPin } = usePinContext();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'verify'>('verify');
  const [pendingAction, setPendingAction] = useState<{ type: 'view' | 'edit' | 'copy'; id: string } | null>(null);

  // Filter & View state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('viewMode-credentials') as 'grid' | 'table') || 'grid';
    }
    return 'grid';
  });
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('viewMode-credentials', viewMode);
  }, [viewMode]);

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

  // Fetch credential data when viewing or editing
  const { data: viewedCredential } = trpc.credentials.getById.useQuery(
    { id: viewingId! },
    { enabled: !!viewingId }
  );

  const { data: editingCredential } = trpc.credentials.getById.useQuery(
    { id: editingId! },
    { enabled: !!editingId }
  );

  // Update pin order mutation with optimistic updates
  const utils = trpc.useUtils();
  const updatePinOrderMutation = trpc.credentials.updatePinOrder.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await utils.credentials.getAll.cancel();

      // Snapshot previous value
      const previousCredentials = utils.credentials.getAll.getData();

      // Optimistically update the cache
      if (previousCredentials) {
        const updatedCredentials = previousCredentials.map(cred => {
          const newOrder = newData.items.find(item => item.id === cred.id);
          return newOrder ? { ...cred, pinOrder: newOrder.pinOrder } : cred;
        });
        utils.credentials.getAll.setData(undefined, updatedCredentials);
      }

      return { previousCredentials };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousCredentials) {
        utils.credentials.getAll.setData(undefined, context.previousCredentials);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      utils.credentials.getAll.invalidate();
    },
  });

  const handleReorderPinned = (items: { id: string; pinOrder: number }[]) => {
    updatePinOrderMutation.mutate({ items });
  };

  const handleCopy = async (text: string) => {
    await copySecureToClipboard(text);
    toast.success('Copied! (clears in 30s)');
  };

  // Password generator
  const generatePassword = (length = 16) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(20);
    setFormData({ ...formData, data: newPassword });
    toast.success('Password generated!');
  };

  // PIN-protected action handler
  const handleProtectedAction = (type: 'view' | 'edit' | 'copy', id: string) => {
    // If no PIN is set, show setup modal
    if (hasPin === false) {
      setPinModalMode('setup');
      setPendingAction({ type, id });
      setShowPinModal(true);
      return;
    }

    // If PIN is required (set but not unlocked), show verify modal
    if (checkPinRequired()) {
      setPinModalMode('verify');
      setPendingAction({ type, id });
      setShowPinModal(true);
      return;
    }

    // PIN unlocked or no PIN needed, execute action
    executeAction(type, id);
  };

  const executeAction = (type: 'view' | 'edit' | 'copy', id: string) => {
    if (type === 'view') {
      setViewingId(id);
    } else if (type === 'edit') {
      setEditingId(id);
    }
    // Copy is handled separately after fetching
  };

  const handlePinSuccess = (rememberSession: boolean) => {
    setShowPinModal(false);
    unlock(rememberSession);
    refetchHasPin();

    // Execute pending action
    if (pendingAction) {
      executeAction(pendingAction.type, pendingAction.id);
      setPendingAction(null);
    }
  };

  // Filter credentials by selected categories
  const filteredCredentials = selectedCategories.length > 0
    ? credentials?.filter(c => selectedCategories.includes(c.category))
    : credentials;

  // Sort all credentials by pinOrder (pinned first, then by pinOrder, then by createdAt)
  const sortedCredentials = filteredCredentials?.slice().sort((a, b) => {
    // Pinned items first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Then by pinOrder
    const orderA = a.pinOrder ?? 999999;
    const orderB = b.pinOrder ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    // Then by createdAt
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Progressive loading
  const displayedCredentials = sortedCredentials?.slice(0, displayCount);
  const hasMoreToLoad = (sortedCredentials?.length || 0) > displayCount;
  const remainingCount = (sortedCredentials?.length || 0) - displayCount;

  // Reset display count when filter changes
  useEffect(() => {
    setDisplayCount(INITIAL_DISPLAY_COUNT);
  }, [selectedCategories]);

  // Get unique categories from credentials
  const usedCategories = [...new Set(credentials?.map(c => c.category) || [])];

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

    // Check for duplicate name (only for new credentials)
    if (!editingId) {
      const normalizedName = formData.name.toLowerCase().trim();
      const duplicate = credentials?.find(cred =>
        cred.name.toLowerCase().trim() === normalizedName
      );
      if (duplicate) {
        toast.warning(`Credential with name "${duplicate.name}" already exists`);
        return;
      }
    }

    if (editingId) {
      onUpdateCredential({ id: editingId, ...formData });
      setEditingId(null);
    } else {
      onCreateCredential(formData);
    }
    setFormData({ name: '', data: '', category: 'General' });
    setShowDialog(false);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  // Populate form when editing credential is loaded
  if (editingCredential && editingId && !showDialog) {
    setFormData({
      name: editingCredential.name,
      data: editingCredential.data,
      category: editingCredential.category,
    });
    setShowDialog(true);
  }

  const handleCancel = () => {
    setShowDialog(false);
    setEditingId(null);
    setFormData({ name: '', data: '', category: 'General' });
  };

  return (
    <div className={dialogStyles.section}>
      <div className={dialogStyles.sectionHeader}>
        <h2 className={dialogStyles.sectionTitle}>Credentials</h2>
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
            Add Credential
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

      {/* Add/Edit Credential Dialog */}
      {showDialog && (
        <div className={dialogStyles.overlay}>
          <div className={dialogStyles.dialog}>
            <div className={dialogStyles.dialogHeader}>
              <h3 className={dialogStyles.dialogTitle}>{editingId ? 'Edit Credential' : 'Add New Credential'}</h3>
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
                <label className={dialogStyles.label}>Password/Secret *</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input
                    type="text"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className={dialogStyles.input}
                    placeholder={editingId ? 'Enter new password or leave current' : ''}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePassword}
                    title="Generate secure password"
                    style={{ flexShrink: 0 }}
                  >
                    <RefreshCw style={{ width: '1rem', height: '1rem' }} />
                  </Button>
                  {formData.data && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCopy(formData.data)}
                      title="Copy password"
                      style={{ flexShrink: 0 }}
                    >
                      <Copy style={{ width: '1rem', height: '1rem' }} />
                    </Button>
                  )}
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginTop: '4px' }}>
                  Click <RefreshCw style={{ width: '0.75rem', height: '0.75rem', display: 'inline' }} /> to generate a secure 20-character password
                </p>
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
              <div className={dialogStyles.formActions}>
                <Button type="submit" style={{ flex: 1 }}>{editingId ? 'Update' : 'Add'} Credential</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table View - All credentials are draggable */}
      {viewMode === 'table' && displayedCredentials && displayedCredentials.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-2)' }}>
            Drag rows to reorder
          </p>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 'var(--text-sm)',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)', width: '30px' }}></th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Name</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Kategorie</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {displayedCredentials.map((cred) => (
                <tr
                  key={cred.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', cred.id);
                    (e.currentTarget as HTMLElement).style.opacity = '0.5';
                  }}
                  onDragEnd={(e) => {
                    (e.currentTarget as HTMLElement).style.opacity = '1';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-light, rgba(59, 130, 246, 0.1))';
                  }}
                  onDragLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = cred.isPinned
                      ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0.05) 100%)'
                      : 'transparent';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).style.background = cred.isPinned
                      ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0.05) 100%)'
                      : 'transparent';
                    const draggedId = e.dataTransfer.getData('text/plain');
                    if (draggedId && draggedId !== cred.id && sortedCredentials) {
                      const draggedIndex = sortedCredentials.findIndex(c => c.id === draggedId);
                      const targetIndex = sortedCredentials.findIndex(c => c.id === cred.id);
                      if (draggedIndex !== -1 && targetIndex !== -1) {
                        const newItems = [...sortedCredentials];
                        const [draggedItem] = newItems.splice(draggedIndex, 1);
                        newItems.splice(targetIndex, 0, draggedItem);
                        const updatedOrders = newItems.map((item, idx) => ({ id: item.id, pinOrder: idx }));
                        handleReorderPinned(updatedOrders);
                      }
                    }
                  }}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    background: cred.isPinned
                      ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0.05) 100%)'
                      : 'transparent',
                    borderLeft: cred.isPinned ? '3px solid #facc15' : '3px solid transparent',
                    cursor: 'grab',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = cred.isPinned
                    ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.2) 0%, rgba(250, 204, 21, 0.1) 100%)'
                    : 'var(--color-muted)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = cred.isPinned
                    ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0.05) 100%)'
                    : 'transparent'}
                >
                  <td style={{ padding: 'var(--space-2)', color: 'var(--color-muted-foreground)', cursor: 'grab' }}>
                    ⋮⋮
                  </td>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Shield style={{ width: '14px', height: '14px', color: 'var(--color-muted-foreground)' }} />
                      {cred.name}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)',
                      background: colorMap[cred.category] || 'var(--color-muted)',
                      color: colorMap[cred.category] ? 'white' : 'var(--color-foreground)',
                    }}>
                      {cred.category}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                      <Button variant="ghost" size="icon" onClick={() => onTogglePin(cred.id)} title={cred.isPinned ? 'Unpin' : 'Pin'}>
                        <Star style={{ width: '14px', height: '14px', fill: cred.isPinned ? '#eab308' : 'none', color: cred.isPinned ? '#eab308' : 'currentColor' }} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleProtectedAction('view', cred.id)} title="View">
                        <Eye style={{ width: '14px', height: '14px' }} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleProtectedAction('edit', cred.id)} title="Edit">
                        <Edit style={{ width: '14px', height: '14px' }} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this credential?')) onDeleteCredential(cred.id); }} title="Delete">
                        <Trash2 style={{ width: '14px', height: '14px', color: 'var(--color-destructive)' }} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Grid View - All Credentials Draggable */}
      {viewMode === 'grid' && displayedCredentials && displayedCredentials.length > 0 && (
        <div className={dialogStyles.cardSection}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-2)' }}>
            Drag cards to reorder
          </p>
          <DraggableGrid
            items={displayedCredentials}
            onReorder={handleReorderPinned}
            className={dialogStyles.grid}
            renderItem={(cred) => (
              <CredentialCard
                credential={cred}
                onTogglePin={onTogglePin}
                onView={(id) => handleProtectedAction('view', id)}
                onEdit={(id) => handleProtectedAction('edit', id)}
                onDelete={onDeleteCredential}
                onAddNote={onAddNote}
                categoryColor={colorMap[cred.category]}
                notesCount={notesCountByCredentialId[cred.id] || 0}
                linkedNotes={notesByCredentialId[cred.id] || []}
              />
            )}
          />
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
        </div>
      )}

      {/* Empty State */}
      {(!credentials || credentials.length === 0) && (
        <div className={dialogStyles.emptyState}>
          <div className={dialogStyles.emptyIcon}>
            <Shield style={{ width: '1.5rem', height: '1.5rem', color: 'var(--color-muted-foreground)' }} />
          </div>
          <h3 className={dialogStyles.emptyTitle}>No credentials yet</h3>
          <p className={dialogStyles.emptyDescription}>
            Securely store your passwords and secrets
          </p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
            Add Credential
          </Button>
        </div>
      )}

      {/* View Credential Modal */}
      {viewingId && viewedCredential && (
        <div className={dialogStyles.overlay}>
          <div className={`${dialogStyles.dialog} ${dialogStyles.viewModal}`}>
            <div className={dialogStyles.dialogHeader}>
              <div>
                <h3 className={dialogStyles.dialogTitle}>{viewedCredential.name}</h3>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted-foreground)' }}>
                  {viewedCredential.category}
                </span>
              </div>
              <button
                onClick={() => setViewingId(null)}
                className={dialogStyles.closeButton}
              >
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>

            <div className={dialogStyles.viewContent}>
              <div className={dialogStyles.dataDisplay}>
                <div className={dialogStyles.dataHeader}>
                  <label>Decrypted Data</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(viewedCredential.data)}
                  >
                    <Copy style={{ width: '0.75rem', height: '0.75rem', marginRight: 'var(--space-2)' }} />
                    Copy
                  </Button>
                </div>
                <pre className={dialogStyles.dataContent}>
                  {viewedCredential.data}
                </pre>
              </div>

              <div className={styles.securityBadge}>
                <Shield />
                <span>This data was encrypted with AES-256-GCM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingAction(null);
        }}
        onSuccess={handlePinSuccess}
        mode={pinModalMode}
      />
    </div>
  );
}
