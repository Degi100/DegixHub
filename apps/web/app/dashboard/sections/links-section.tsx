'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash2, Plus, Star, Edit } from 'lucide-react';
import { trpc } from '@/lib/trpc/react';
import { PinModal } from '../components/pin';
import { copySecureToClipboard } from '@/lib/clipboard';
import { DraggableGrid, DraggableTable, ViewToggle, CategoryFilter, ActiveFilters } from '../components/ui';
import { LinkCard } from '../components/cards';
import type { Link, LinkedNote } from '../components/cards';
import { LinkFormDialog } from '../components/dialogs';
import { useViewMode, useCategoryFilter, usePinProtection } from '../hooks';
import dialogStyles from '../components/dialogs/dialog.module.css';

interface CredentialOption {
  id: string;
  name: string;
}

interface LinksSectionProps {
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

export function LinksSection({ links, onDeleteLink, onTogglePin, onCreateLink, onUpdateLink, categories, colorMap = {}, onAddCategory, onAddNote, notesCountByLinkId = {}, notesByLinkId = {}, credentials = [] }: LinksSectionProps) {
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

  // PIN protection using hook
  const {
    showPinModal,
    pinModalMode,
    handleProtectedAction: pinProtectedAction,
    handlePinSuccess,
    handlePinClose,
  } = usePinProtection({ onExecute: (credentialId: string) => setCopyingCredentialId(credentialId) });

  // Filter & View state (using hooks)
  const [viewMode, setViewMode] = useViewMode('links');
  const {
    selectedCategories,
    toggleCategoryFilter,
    clearFilters,
    filteredItems: filteredLinks,
    usedCategories,
    displayCount,
    loadMore,
  } = useCategoryFilter(links);

  // Fetch metadata mutation
  const fetchMetadataMutation = trpc.links.fetchMetadata.useMutation();

  // Update pin order mutation
  const utils = trpc.useUtils();
  const updatePinOrderMutation = trpc.links.updatePinOrder.useMutation({
    onSuccess: () => {
      utils.links.getAll.invalidate();
    },
  });

  const handleReorderPinned = (items: { id: string; pinOrder: number }[]) => {
    updatePinOrderMutation.mutate({ items });
  };

  // Query for copying credentials
  const { data: credentialToCopy } = trpc.credentials.getById.useQuery(
    { id: copyingCredentialId! },
    { enabled: !!copyingCredentialId }
  );

  // Copy credential to clipboard when data is fetched (with auto-clear)
  if (credentialToCopy && copyingCredentialId) {
    copySecureToClipboard(credentialToCopy.data);
    import('sonner').then(({ toast }) => toast.success('Credential copied! (clears in 30s)'));
    setCopyingCredentialId(null);
  }

  // PIN-protected credential copy handler
  const handleCopyCredential = (credentialId: string) => {
    pinProtectedAction(credentialId);
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
          // Try fallback favicon from Google
          try {
            const urlObj = new URL(url);
            const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
            setFormData(prev => ({
              ...prev,
              favicon: prev.favicon || fallbackFavicon,
            }));
          } catch {
            // Ignore URL parse errors
          }
        }
        setIsFetchingMeta(false);
      }, 800);
    }
  };

  // Sort all links by pinOrder (pinned first, then by pinOrder, then by createdAt)
  const sortedLinks = filteredLinks?.slice().sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const orderA = a.pinOrder ?? 999999;
    const orderB = b.pinOrder ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Progressive loading
  const displayedLinks = sortedLinks?.slice(0, displayCount);
  const hasMoreToLoad = (sortedLinks?.length || 0) > displayCount;
  const remainingCount = (sortedLinks?.length || 0) - displayCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicate URL (only for new links)
    if (!editingLink) {
      const normalizedUrl = formData.url.toLowerCase().replace(/\/$/, '');
      const duplicate = links?.find(link =>
        link.url.toLowerCase().replace(/\/$/, '') === normalizedUrl
      );
      if (duplicate) {
        import('sonner').then(({ toast }) =>
          toast.warning(`Link with similar URL already exists: "${duplicate.name}"`)
        );
        return;
      }
    }

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
            Add Link
          </Button>
        </div>
      </div>

      <ActiveFilters
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategoryFilter}
        colorMap={colorMap}
      />

      {/* Add/Edit Link Dialog */}
      <LinkFormDialog
        isOpen={showDialog}
        isEditing={!!editingLink}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onUrlChange={handleUrlChange}
        isFetchingMeta={isFetchingMeta}
        categories={categories}
        onAddCategory={onAddCategory}
        credentials={credentials}
      />

      {/* Table View */}
      {viewMode === 'table' && displayedLinks && displayedLinks.length > 0 && (
        <DraggableTable
          items={displayedLinks}
          columns={[
            {
              key: 'favicon',
              header: '',
              width: '40px',
              render: (link) => link.favicon ? (
                <img src={link.favicon} alt="" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
              ) : (
                <ExternalLink style={{ width: '16px', height: '16px', color: 'var(--color-muted-foreground)' }} />
              ),
            },
            {
              key: 'name',
              header: 'Link',
              render: (link) => (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  {link.name}
                </a>
              ),
            },
            {
              key: 'description',
              header: 'Beschreibung',
              render: (link) => (
                <span style={{ color: 'var(--color-muted-foreground)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {link.description || '-'}
                </span>
              ),
            },
            {
              key: 'category',
              header: 'Kategorie',
              render: (link) => (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  background: colorMap[link.category] || 'var(--color-muted)',
                  color: colorMap[link.category] ? 'white' : 'var(--color-foreground)',
                }}>
                  {link.category}
                </span>
              ),
            },
          ]}
          onReorder={handleReorderPinned}
          renderActions={(link) => (
            <>
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
            </>
          )}
          hasMoreToLoad={hasMoreToLoad}
          remainingCount={remainingCount}
          onLoadMore={loadMore}
        />
      )}

      {/* Grid View - All Links Draggable */}
      {viewMode === 'grid' && displayedLinks && displayedLinks.length > 0 && (
        <div className={dialogStyles.cardSection}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-2)' }}>
            Drag cards to reorder
          </p>
          <DraggableGrid
            items={displayedLinks}
            onReorder={handleReorderPinned}
            className={dialogStyles.grid}
            renderItem={(link) => (
              <LinkCard
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
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        mode={pinModalMode}
      />
    </div>
  );
}
