'use client';

import { Button } from '@/components/ui/button';
import { Star, Edit, Trash2, Link as LinkIcon, Key } from 'lucide-react';
import styles from './card.module.css';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean | null;
  pinOrder?: number | null;
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

export interface LinkedLink {
  id: string;
  name: string;
  url: string;
}

export interface LinkedCredential {
  id: string;
  name: string;
}

interface NoteCardProps {
  note: Note;
  onTogglePin: (id: string) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  links: LinkedLink[];
  credentials: LinkedCredential[];
  categoryColor?: string;
}

export function NoteCard({
  note,
  onTogglePin,
  onEdit,
  onDelete,
  links,
  credentials,
  categoryColor,
}: NoteCardProps) {
  const linkedLink = links.find(l => l.id === note.linkedLinkId);
  const linkedCredential = credentials.find(c => c.id === note.linkedCredentialId);
  const categoryClass = note.category.toLowerCase();
  const hasCustomColor = categoryColor && !styles[`card--${categoryClass}`];

  return (
    <div
      className={`${styles.card} ${!hasCustomColor ? styles[`card--${categoryClass}`] : ''} ${note.isPinned ? styles.cardPinned : ''}`}
      style={hasCustomColor ? {
        '--custom-category-color': categoryColor,
      } as React.CSSProperties : undefined}
      onMouseEnter={(e) => {
        if (hasCustomColor && !note.isPinned) {
          (e.currentTarget as HTMLElement).style.borderColor = `${categoryColor}80`;
        }
      }}
      onMouseLeave={(e) => {
        if (hasCustomColor && !note.isPinned) {
          (e.currentTarget as HTMLElement).style.borderColor = '';
        }
      }}
    >
      {/* Category Badge */}
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
      </div>

      {/* Actions & Date */}
      <div className={styles.cardActions} style={{ marginTop: 'auto' }}>
        <span className={styles.cardDate} style={{ marginRight: 'auto' }}>
          {note.createdAt === note.updatedAt
            ? `Erstellt ${new Date(note.createdAt).toLocaleDateString('de-DE')}`
            : `Aktualisiert ${new Date(note.updatedAt).toLocaleDateString('de-DE')}`}
        </span>
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
