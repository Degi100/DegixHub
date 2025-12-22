'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Eye, Trash2, X, Edit, StickyNote, ChevronDown, ChevronUp, Shield, ExternalLink } from 'lucide-react';
import styles from './card.module.css';
import dialogStyles from '../dialogs/dialog.module.css';

export interface Credential {
  id: string;
  name: string;
  category: string;
  isPinned?: boolean | null;
  pinOrder?: number | null;
  linkedLinkId?: string | null;
  createdAt: string;
}

export interface LinkedLink {
  id: string;
  name: string;
  url: string;
}

export interface LinkedNote {
  id: string;
  title: string;
  content: string;
}

interface CredentialCardProps {
  credential: Credential;
  onTogglePin: (id: string) => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddNote?: (credentialId: string) => void;
  categoryColor?: string;
  notesCount?: number;
  linkedNotes?: LinkedNote[];
  linkedLink?: LinkedLink | null;
}

export function CredentialCard({
  credential,
  onTogglePin,
  onView,
  onEdit,
  onDelete,
  onAddNote,
  categoryColor,
  notesCount = 0,
  linkedNotes = [],
  linkedLink,
}: CredentialCardProps) {
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
        {linkedLink && (
          <a
            href={linkedLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkedLinkBadge}
            title={`Öffne ${linkedLink.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink style={{ width: '0.75rem', height: '0.75rem' }} />
            {linkedLink.name}
          </a>
        )}
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
