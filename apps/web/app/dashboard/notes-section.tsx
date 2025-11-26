'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Plus, X, Edit, Trash2, Link as LinkIcon, Key } from 'lucide-react';
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
}

// Note Card Component
function NoteCard({
  note,
  onTogglePin,
  onEdit,
  onDelete,
}: {
  note: Note;
  onTogglePin: (id: string) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}) {
  const categoryClass = note.category.toLowerCase();

  return (
    <div className={`${styles.card} ${styles[`card--${categoryClass}`]}`}>
      {/* Category Badge & Pin */}
      <div className={styles.cardHeader}>
        <span className={`${styles.categoryBadge} ${styles[`categoryBadge--${categoryClass}`]}`}>
          {note.category}
        </span>
        {note.isPinned && (
          <Star className={styles.pinIcon} />
        )}
      </div>

      {/* Content */}
      <div className={styles.cardContent}>
        <h4 className={styles.cardTitle}>{note.title}</h4>
        <p className={styles.cardDescription}>
          {note.content.slice(0, 150)}{note.content.length > 150 ? '...' : ''}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
          {note.linkedLinkId && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)' }} title="Linked to a Link">
              <LinkIcon style={{ width: '0.875rem', height: '0.875rem', display: 'inline', verticalAlign: 'middle' }} />
            </span>
          )}
          {note.linkedCredentialId && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)' }} title="Linked to a Credential">
              <Key style={{ width: '0.875rem', height: '0.875rem', display: 'inline', verticalAlign: 'middle' }} />
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
  onCreate,
  onUpdate,
  onDelete,
  onTogglePin,
}: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
  });

  // Filter notes
  const filteredNotes = notes.filter((note) =>
    searchQuery
      ? note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const pinnedNotes = filteredNotes.filter(n => n.isPinned).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

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
        linkedLinkId: undefined,
        linkedCredentialId: undefined,
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
    });
    setShowDialog(true);
  };

  const handleCancel = () => {
    setShowDialog(false);
    setEditingNote(null);
    setFormData({ title: '', content: '', category: 'General' });
  };

  return (
    <div className={dialogStyles.section}>
      <div className={dialogStyles.sectionHeader}>
        <h2 className={dialogStyles.sectionTitle}>Notes</h2>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
          Add Note
        </Button>
      </div>

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
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={dialogStyles.input}
                >
                  <option value="General">General</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Ideas">Ideas</option>
                  <option value="Projects">Projects</option>
                  <option value="Todo">Todo</option>
                  <option value="Documentation">Documentation</option>
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

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
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
              />
            ))}
          </div>
        </div>
      )}

      {/* All Notes */}
      <div className={dialogStyles.cardSection}>
        <h3 className={dialogStyles.subsectionTitle}>
          {pinnedNotes.length > 0 ? 'All Notes' : 'Notes'} ({unpinnedNotes.length})
        </h3>
        {unpinnedNotes.length === 0 ? (
          <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-4)' }}>
            {searchQuery ? 'No notes found' : 'No notes yet. Create your first note!'}
          </p>
        ) : (
          <div className={dialogStyles.grid}>
            {unpinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onTogglePin={onTogglePin}
                onEdit={handleEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
