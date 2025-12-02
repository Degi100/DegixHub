'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, Trash2, Edit, Copy, Check, StickyNote, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';
import { ViewNoteModal } from '../dialogs';
import styles from './card.module.css';

export interface Link {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string | null;
  favicon?: string | null;
  isPinned?: boolean | null;
  pinOrder?: number | null;
  linkedCredentialId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedNote {
  id: string;
  title: string;
  content: string;
}

interface LinkCardProps {
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
}

export function LinkCard({
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
}: LinkCardProps) {
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
      className={`${styles.card} ${!hasCustomColor ? styles[`card--${categoryClass}`] : ''} ${link.isPinned ? styles.cardPinned : ''}`}
      style={hasCustomColor ? {
        '--custom-category-color': categoryColor,
      } as React.CSSProperties : undefined}
      onMouseEnter={(e) => {
        if (hasCustomColor && !link.isPinned) {
          (e.currentTarget as HTMLElement).style.borderColor = `${categoryColor}80`;
        }
      }}
      onMouseLeave={(e) => {
        if (hasCustomColor && !link.isPinned) {
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
      <ViewNoteModal
        note={previewNote ? {
          id: previewNote.id,
          title: previewNote.title,
          content: previewNote.content,
          category: 'Note',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } : null}
        onClose={() => setPreviewNote(null)}
      />

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
      </div>

      {/* Actions & Date */}
      <div className={styles.cardActions} style={{ marginTop: 'auto' }}>
        <span className={styles.cardDate} style={{ marginRight: 'auto' }}>
          {link.createdAt === link.updatedAt
            ? `Erstellt ${new Date(link.createdAt).toLocaleDateString('de-DE')}`
            : `Aktualisiert ${new Date(link.updatedAt).toLocaleDateString('de-DE')}`}
        </span>
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
