'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Eye, Copy, Trash2, Plus, Shield, X, Edit, StickyNote, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/react';
import { CategorySelect } from './category-select';
import { PinModal } from './pin-modal';
import { usePinContext } from './pin-context';
import { copyToClipboard } from '@/lib/clipboard';
import styles from './card.module.css';
import dialogStyles from './dialog.module.css';

interface Credential {
  id: string;
  name: string;
  category: string;
  isPinned?: boolean | null;
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
          {credential.isPinned && (
            <Star className={styles.pinIcon} />
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
      <div className={`${styles.cardContent} ${styles.credentialContent}`}>
        <h4 className={styles.cardTitle}>{credential.name}</h4>
        <p className={styles.passwordDots}>••••••••</p>
        <p className={styles.cardDate}>
          {new Date(credential.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </p>
      </div>

      {/* Actions */}
      <div className={styles.cardActions}>
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

  // Fetch credential data when viewing or editing
  const { data: viewedCredential } = trpc.credentials.getById.useQuery(
    { id: viewingId! },
    { enabled: !!viewingId }
  );

  const { data: editingCredential } = trpc.credentials.getById.useQuery(
    { id: editingId! },
    { enabled: !!editingId }
  );

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    toast.success('Copied to clipboard');
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

  const pinnedCredentials = credentials?.filter(c => c.isPinned).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unpinnedCredentials = credentials?.filter(c => !c.isPinned).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
          Add Credential
        </Button>
      </div>

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
                <input
                  type="password"
                  required
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className={dialogStyles.input}
                  placeholder={editingId ? 'Enter new password or leave current' : ''}
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
              <div className={dialogStyles.formActions}>
                <Button type="submit" style={{ flex: 1 }}>{editingId ? 'Update' : 'Add'} Credential</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pinned Credentials */}
      {pinnedCredentials && pinnedCredentials.length > 0 && (
        <div className={dialogStyles.cardSection}>
          <h3 className={dialogStyles.subsectionTitle}>
            <Star className={styles.pinIcon} />
            Pinned ({pinnedCredentials.length})
          </h3>
          <div className={dialogStyles.grid}>
            {pinnedCredentials.map((cred) => (
              <CredentialCard
                key={cred.id}
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
            ))}
          </div>
        </div>
      )}

      {/* Regular Credentials */}
      {unpinnedCredentials && unpinnedCredentials.length > 0 && (
        <div className={dialogStyles.cardSection}>
          {pinnedCredentials && pinnedCredentials.length > 0 && (
            <h3 className={dialogStyles.subsectionTitle}>
              All Credentials ({unpinnedCredentials.length})
            </h3>
          )}
          <div className={dialogStyles.grid}>
            {unpinnedCredentials.map((cred) => (
              <CredentialCard
                key={cred.id}
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
            ))}
          </div>
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
