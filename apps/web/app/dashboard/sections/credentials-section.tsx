'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Eye, Trash2, Plus, Edit, Shield, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/react';
import { PinModal } from '../components/pin';
import { DraggableGrid, DraggableTable, ViewToggle, CategoryFilter, ActiveFilters } from '../components/ui';
import { CredentialCard } from '../components/cards';
import type { Credential, CredentialLinkedNote as LinkedNote } from '../components/cards';
import { CredentialFormDialog, ViewCredentialModal } from '../components/dialogs';
import { useViewMode, useCategoryFilter, usePinProtection } from '../hooks';
import dialogStyles from '../components/dialogs/dialog.module.css';

interface LinkOption {
  id: string;
  name: string;
  url: string;
}

interface CredentialsSectionProps {
  credentials: Credential[] | undefined;
  onDeleteCredential: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCreateCredential: (data: { name: string; data: string; category: string; linkedLinkId?: string | null }) => void;
  onUpdateCredential: (data: { id: string; name: string; data: string; category: string; linkedLinkId?: string | null }) => void;
  categories: string[];
  colorMap?: Record<string, string>;
  onAddCategory: (name: string, color?: string) => void;
  onAddNote?: (credentialId: string) => void;
  notesCountByCredentialId?: Record<string, number>;
  notesByCredentialId?: Record<string, LinkedNote[]>;
  links?: LinkOption[];
}

export function CredentialsSection({
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
  links = [],
}: CredentialsSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    data: '',
    category: 'General',
    linkedLinkId: null as string | null,
  });

  // PIN protection using hook
  const executeAction = (action: { type: 'view' | 'edit'; id: string }) => {
    if (action.type === 'view') {
      setViewingId(action.id);
    } else if (action.type === 'edit') {
      setEditingId(action.id);
    }
  };

  const {
    showPinModal,
    pinModalMode,
    handleProtectedAction: pinProtectedAction,
    handlePinSuccess,
    handlePinClose,
  } = usePinProtection({ onExecute: executeAction });

  // Filter & View state (using hooks)
  const [viewMode, setViewMode] = useViewMode('credentials');
  const {
    selectedCategories,
    toggleCategoryFilter,
    clearFilters,
    filteredItems: filteredCredentials,
    usedCategories,
    displayCount,
    loadMore,
  } = useCategoryFilter(credentials);

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

  // Wrapper for PIN-protected actions
  const handleProtectedAction = (type: 'view' | 'edit', id: string) => {
    pinProtectedAction({ type, id });
  };

  // Create a map of link ID to link for quick lookup
  const linksMap = new Map(links.map((link) => [link.id, link]));

  // Sort all credentials by pinOrder (pinned first, then by pinOrder, then by createdAt)
  const sortedCredentials = filteredCredentials?.slice().sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const orderA = a.pinOrder ?? 999999;
    const orderB = b.pinOrder ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Progressive loading
  const displayedCredentials = sortedCredentials?.slice(0, displayCount);
  const hasMoreToLoad = (sortedCredentials?.length || 0) > displayCount;
  const remainingCount = (sortedCredentials?.length || 0) - displayCount;

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
    setFormData({ name: '', data: '', category: 'General', linkedLinkId: null });
    setShowDialog(false);
  };

  // Populate form when editing credential is loaded
  if (editingCredential && editingId && !showDialog) {
    setFormData({
      name: editingCredential.name,
      data: editingCredential.data,
      category: editingCredential.category,
      linkedLinkId: editingCredential.linkedLinkId || null,
    });
    setShowDialog(true);
  }

  const handleCancel = () => {
    setShowDialog(false);
    setEditingId(null);
    setFormData({ name: '', data: '', category: 'General', linkedLinkId: null });
  };

  return (
    <div className={dialogStyles.section}>
      <div className={dialogStyles.sectionHeader}>
        <h2 className={dialogStyles.sectionTitle}>Credentials</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <CategoryFilter
            categories={usedCategories}
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategoryFilter}
            onClearFilters={clearFilters}
            colorMap={colorMap}
          />
          <Button size="sm" onClick={() => setShowDialog(true)}>
            <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
            Add Credential
          </Button>
        </div>
      </div>

      <ActiveFilters
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategoryFilter}
        colorMap={colorMap}
      />

      {/* Add/Edit Credential Dialog */}
      <CredentialFormDialog
        isOpen={showDialog}
        isEditing={!!editingId}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        categories={categories}
        onAddCategory={onAddCategory}
        links={links}
      />

      {/* Table View */}
      {viewMode === 'table' && displayedCredentials && displayedCredentials.length > 0 && (
        <DraggableTable
          items={displayedCredentials}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (cred) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 500 }}>
                  <Shield style={{ width: '14px', height: '14px', color: 'var(--color-muted-foreground)' }} />
                  {cred.name}
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Kategorie',
              render: (cred) => (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  background: colorMap[cred.category] || 'var(--color-muted)',
                  color: colorMap[cred.category] ? 'white' : 'var(--color-foreground)',
                }}>
                  {cred.category}
                </span>
              ),
            },
            {
              key: 'linkedLink',
              header: 'Link',
              render: (cred) => {
                const link = cred.linkedLinkId ? linksMap.get(cred.linkedLinkId) : null;
                if (!link) return <span style={{ color: 'var(--color-muted-foreground)', fontSize: 'var(--text-xs)' }}>—</span>;
                return (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 500,
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      border: '1px solid rgba(59, 130, 246, 0.25)',
                      textDecoration: 'none',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink style={{ width: '12px', height: '12px' }} />
                    {link.name}
                  </a>
                );
              },
            },
          ]}
          onReorder={handleReorderPinned}
          renderActions={(cred) => (
            <>
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
            </>
          )}
          hasMoreToLoad={hasMoreToLoad}
          remainingCount={remainingCount}
          onLoadMore={loadMore}
        />
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
                linkedLink={cred.linkedLinkId ? linksMap.get(cred.linkedLinkId) : null}
              />
            )}
          />
          {/* Load More Button */}
          {hasMoreToLoad && (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
              <Button variant="outline" onClick={() => loadMore()}>
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
      <ViewCredentialModal
        credential={viewingId && viewedCredential ? viewedCredential : null}
        onClose={() => setViewingId(null)}
        linkedLink={viewedCredential?.linkedLinkId ? linksMap.get(viewedCredential.linkedLinkId) : null}
      />

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        mode={pinModalMode}
      />
    </div>
  );
}
