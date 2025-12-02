'use client';

import { Button } from '@/components/ui/button';
import { X, Copy, Link as LinkIcon, Key } from 'lucide-react';
import { toast } from 'sonner';
import dialogStyles from './dialog.module.css';

interface ViewNoteModalProps {
  note: {
    id: string;
    title: string;
    content: string;
    category: string;
    linkedLinkId?: string | null;
    linkedCredentialId?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  linkedLink?: { name: string; url: string } | null;
  linkedCredential?: { name: string } | null;
  onClose: () => void;
}

export function ViewNoteModal({ note, linkedLink, linkedCredential, onClose }: ViewNoteModalProps) {
  if (!note) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(note.content);
    toast.success('Content copied!');
  };

  return (
    <div className={dialogStyles.overlay} onClick={onClose}>
      <div
        className={`${dialogStyles.dialog} ${dialogStyles.viewModal}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={dialogStyles.dialogHeader}>
          <div>
            <h3 className={dialogStyles.dialogTitle}>{note.title}</h3>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted-foreground)' }}>
              {note.category}
            </span>
          </div>
          <button onClick={onClose} className={dialogStyles.closeButton}>
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>

        <div className={dialogStyles.viewContent}>
          <div className={dialogStyles.dataDisplay}>
            <div className={dialogStyles.dataHeader}>
              <label>Content</label>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                <Copy style={{ width: '0.75rem', height: '0.75rem', marginRight: 'var(--space-2)' }} />
                Copy
              </Button>
            </div>
            <pre className={dialogStyles.dataContent} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {note.content}
            </pre>
          </div>

          {/* Linked Items */}
          {(linkedLink || linkedCredential) && (
            <div style={{
              display: 'flex',
              gap: 'var(--space-3)',
              marginTop: 'var(--space-3)',
              flexWrap: 'wrap'
            }}>
              {linkedLink && (
                <a
                  href={linkedLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <LinkIcon style={{ width: '1rem', height: '1rem' }} />
                  {linkedLink.name}
                </a>
              )}
              {linkedCredential && (
                <span
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-muted-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Key style={{ width: '1rem', height: '1rem' }} />
                  {linkedCredential.name}
                </span>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-muted-foreground)',
            marginTop: 'var(--space-3)',
            display: 'flex',
            gap: 'var(--space-4)'
          }}>
            <span>Created: {new Date(note.createdAt).toLocaleDateString('de-DE')}</span>
            {note.createdAt !== note.updatedAt && (
              <span>Updated: {new Date(note.updatedAt).toLocaleDateString('de-DE')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
