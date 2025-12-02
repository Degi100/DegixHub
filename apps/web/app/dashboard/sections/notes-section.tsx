'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Plus, Edit, Trash2, StickyNote, Link as LinkIcon, Key } from 'lucide-react';
import { trpc } from '@/lib/trpc/react';
import { DraggableGrid, DraggableTable, ViewToggle, CategoryFilter, ActiveFilters } from '../components/ui';
import { NoteCard } from '../components/cards';
import type { Note, LinkedLink, LinkedCredential } from '../components/cards';
import { NoteFormDialog, ViewNoteModal } from '../components/dialogs';
import { useViewMode } from '../hooks';
import dialogStyles from '../components/dialogs/dialog.module.css';
import type { Note as NoteType } from '../components/cards';

interface Props {
  notes: Note[];
  searchQuery: string;
  links?: LinkedLink[];
  credentials?: LinkedCredential[];
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
  const [viewingNote, setViewingNote] = useState<NoteType | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    linkedLinkId: '',
    linkedCredentialId: '',
  });

  // Filter & View state (using hooks)
  const [viewMode, setViewMode] = useViewMode('notes');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [displayCount, setDisplayCount] = useState(20);

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

  const clearFilters = () => setSelectedCategories([]);
  const loadMore = () => setDisplayCount(prev => prev + 20);

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

  // Sort all notes by pinOrder (pinned first, then by pinOrder, then by updatedAt)
  const sortedNotes = filteredNotes.slice().sort((a, b) => {
    // Pinned items first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Then by pinOrder
    const orderA = a.pinOrder ?? 999999;
    const orderB = b.pinOrder ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    // Then by updatedAt
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Update pin order mutation with optimistic updates
  const utils = trpc.useUtils();
  const updatePinOrderMutation = trpc.notes.updatePinOrder.useMutation({
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await utils.notes.getAll.cancel();

      // Snapshot previous value
      const previousNotes = utils.notes.getAll.getData();

      // Optimistically update the cache
      if (previousNotes) {
        const updatedNotes = previousNotes.map(note => {
          const newOrder = newData.items.find(item => item.id === note.id);
          return newOrder ? { ...note, pinOrder: newOrder.pinOrder } : note;
        });
        utils.notes.getAll.setData(undefined, updatedNotes);
      }

      return { previousNotes };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        utils.notes.getAll.setData(undefined, context.previousNotes);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      utils.notes.getAll.invalidate();
    },
  });

  const handleReorderPinned = (items: { id: string; pinOrder: number }[]) => {
    updatePinOrderMutation.mutate({ items });
  };

  // Progressive loading
  const displayedNotes = sortedNotes.slice(0, displayCount);
  const hasMoreToLoad = sortedNotes.length > displayCount;
  const remainingCount = sortedNotes.length - displayCount;

  // Reset display count when filter changes
  useEffect(() => {
    setDisplayCount(20);
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
            Add Note
          </Button>
        </div>
      </div>

      <ActiveFilters
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategoryFilter}
        colorMap={colorMap}
      />

      {/* Add/Edit Note Dialog */}
      <NoteFormDialog
        isOpen={showDialog}
        isEditing={!!editingNote}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        categories={categories}
        onAddCategory={onAddCategory}
        links={links}
        credentials={credentials}
      />

      {/* Table View */}
      {viewMode === 'table' && displayedNotes.length > 0 && (
        <DraggableTable
          items={displayedNotes}
          columns={[
            {
              key: 'title',
              header: 'Titel',
              render: (note) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 500 }}>
                  <StickyNote style={{ width: '14px', height: '14px', color: 'var(--color-muted-foreground)' }} />
                  {note.title}
                </div>
              ),
            },
            {
              key: 'content',
              header: 'Inhalt',
              render: (note) => (
                <span style={{ color: 'var(--color-muted-foreground)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {note.content.substring(0, 50)}{note.content.length > 50 ? '...' : ''}
                </span>
              ),
            },
            {
              key: 'category',
              header: 'Kategorie',
              render: (note) => (
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  background: colorMap[note.category] || 'var(--color-muted)',
                  color: colorMap[note.category] ? 'white' : 'var(--color-foreground)',
                }}>
                  {note.category}
                </span>
              ),
            },
            {
              key: 'linked',
              header: 'Verknüpft',
              render: (note) => {
                const linkedLink = links.find(l => l.id === note.linkedLinkId);
                const linkedCredential = credentials.find(c => c.id === note.linkedCredentialId);
                return (
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
                );
              },
            },
          ]}
          onReorder={handleReorderPinned}
          renderActions={(note) => (
            <>
              <Button variant="ghost" size="icon" onClick={() => onTogglePin(note.id)} title={note.isPinned ? 'Unpin' : 'Pin'}>
                <Star style={{ width: '14px', height: '14px', fill: note.isPinned ? '#eab308' : 'none', color: note.isPinned ? '#eab308' : 'currentColor' }} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleEdit(note)} title="Edit">
                <Edit style={{ width: '14px', height: '14px' }} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this note?')) onDelete(note.id); }} title="Delete">
                <Trash2 style={{ width: '14px', height: '14px', color: 'var(--color-destructive)' }} />
              </Button>
            </>
          )}
          hasMoreToLoad={hasMoreToLoad}
          remainingCount={remainingCount}
          onLoadMore={loadMore}
        />
      )}

      {/* Grid View - All Notes Draggable */}
      {viewMode === 'grid' && displayedNotes.length > 0 && (
        <div className={dialogStyles.cardSection}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-2)' }}>
            Drag cards to reorder
          </p>
          <DraggableGrid
            items={displayedNotes}
            onReorder={handleReorderPinned}
            className={dialogStyles.grid}
            renderItem={(note) => (
              <NoteCard
                note={note}
                onTogglePin={onTogglePin}
                onEdit={handleEdit}
                onDelete={onDelete}
                onView={setViewingNote}
                links={links}
                credentials={credentials}
                categoryColor={colorMap[note.category]}
              />
            )}
          />
          {/* Load More Button */}
          {hasMoreToLoad && (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
              <Button variant="outline" onClick={loadMore}>
                Load More ({remainingCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty State for Grid View */}
      {viewMode === 'grid' && sortedNotes.length === 0 && (
        <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-4)' }}>
          {searchQuery ? 'No notes found' : 'No notes yet. Create your first note!'}
        </p>
      )}

      {/* View Note Modal */}
      <ViewNoteModal
        note={viewingNote}
        linkedLink={viewingNote?.linkedLinkId ? links.find(l => l.id === viewingNote.linkedLinkId) : null}
        linkedCredential={viewingNote?.linkedCredentialId ? credentials.find(c => c.id === viewingNote.linkedCredentialId) : null}
        onClose={() => setViewingNote(null)}
      />
    </div>
  );
}
