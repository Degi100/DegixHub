'use client';

import { useState } from 'react';
import { Plus, Pin, Trash2, Edit, Link as LinkIcon, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import styles from './simple-links-section.module.css';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  linkedLinkId?: string | null;
  linkedCredentialId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

interface Props {
  notes: Note[];
  searchQuery: string;
  onCreate: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'tags' | 'isPinned'>) => void;
  onUpdate: (id: string, note: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export function NotesSection({
  notes,
  searchQuery,
  onCreate,
  onUpdate,
  onDelete,
  onTogglePin,
}: Props) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');

  // Filter notes
  const filteredNotes = notes.filter((note) =>
    searchQuery
      ? note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    if (editingNote) {
      onUpdate(editingNote.id, { title, content, category });
      setEditingNote(null);
    } else {
      onCreate({ title, content, category, linkedLinkId: null, linkedCredentialId: null });
    }

    resetForm();
    setIsCreateDialogOpen(false);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('General');
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      onDelete(id);
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>
          Notes
          <span className={styles.count}>{filteredNotes.length}</span>
        </h2>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className={styles.icon} />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'Create Note'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="content">Content *</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Note content (Markdown supported)"
                  rows={8}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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

              <div className={styles.formActions}>
                <Button type="submit">{editingNote ? 'Update' : 'Create'}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingNote(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className={styles.grid}>
        {filteredNotes.length === 0 ? (
          <p className={styles.empty}>
            {searchQuery ? 'No notes found' : 'No notes yet. Create your first note!'}
          </p>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{note.title}</h3>
                <div className={styles.cardActions}>
                  <button
                    onClick={() => onTogglePin(note.id)}
                    className={note.isPinned ? styles.pinned : ''}
                    title={note.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin />
                  </button>
                  <button onClick={() => handleEdit(note)} title="Edit">
                    <Edit />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className={styles.deleteBtn}
                    title="Delete"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>

              <div className={styles.noteContent}>
                <p>{note.content.slice(0, 150)}{note.content.length > 150 ? '...' : ''}</p>
              </div>

              <div className={styles.cardMeta}>
                <span className={styles.category}>{note.category}</span>
                {note.linkedLinkId && (
                  <span className={styles.linkedIcon} title="Linked to a Link">
                    <LinkIcon size={14} />
                  </span>
                )}
                {note.linkedCredentialId && (
                  <span className={styles.linkedIcon} title="Linked to a Credential">
                    <Key size={14} />
                  </span>
                )}
                {note.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className={styles.tag}
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.date}>
                  Updated {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
