'use client';

import { useState } from 'react';
import { Star, ExternalLink, Key, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc/react';
import { copySecureToClipboard } from '@/lib/clipboard';
import { PinModal } from '../components/pin';
import { usePinProtection } from '../hooks';
import { ViewNoteModal } from '../components/dialogs';
import dialogStyles from '../components/dialogs/dialog.module.css';
import styles from './pinned-section.module.css';

interface PinnedLink {
  id: string;
  name: string;
  url: string;
  category: string;
  description?: string | null;
  favicon?: string | null;
  isPinned?: boolean | null;
  pinOrder?: number | null;
  createdAt: string;
}

interface PinnedCredential {
  id: string;
  name: string;
  category: string;
  isPinned?: boolean | null;
  pinOrder?: number | null;
  createdAt: string;
}

interface PinnedNote {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned?: boolean | null;
  pinOrder?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PinnedSectionProps {
  links: PinnedLink[] | undefined;
  credentials: PinnedCredential[] | undefined;
  notes: PinnedNote[] | undefined;
  colorMap?: Record<string, string>;
  onUnpinLink: (id: string) => void;
  onUnpinCredential: (id: string) => void;
  onUnpinNote: (id: string) => void;
}

type PinnedItem =
  | { type: 'link'; item: PinnedLink }
  | { type: 'credential'; item: PinnedCredential }
  | { type: 'note'; item: PinnedNote };

export function PinnedSection({
  links,
  credentials,
  notes,
  colorMap = {},
  onUnpinLink,
  onUnpinCredential,
  onUnpinNote,
}: PinnedSectionProps) {
  const [copyingCredentialId, setCopyingCredentialId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<PinnedNote | null>(null);

  // PIN protection
  const {
    showPinModal,
    pinModalMode,
    handleProtectedAction: pinProtectedAction,
    handlePinSuccess,
    handlePinClose,
  } = usePinProtection({ onExecute: (credentialId: string) => setCopyingCredentialId(credentialId) });

  // Query for copying credentials
  const { data: credentialToCopy } = trpc.credentials.getById.useQuery(
    { id: copyingCredentialId! },
    { enabled: !!copyingCredentialId }
  );

  // Copy credential to clipboard when data is fetched
  if (credentialToCopy && copyingCredentialId) {
    copySecureToClipboard(credentialToCopy.data);
    import('sonner').then(({ toast }) => toast.success('Credential copied! (clears in 30s)'));
    setCopyingCredentialId(null);
  }

  // Combine all pinned items
  const pinnedLinks = links?.filter((l) => l.isPinned) || [];
  const pinnedCredentials = credentials?.filter((c) => c.isPinned) || [];
  const pinnedNotes = notes?.filter((n) => n.isPinned) || [];

  const allPinnedItems: PinnedItem[] = [
    ...pinnedLinks.map((item) => ({ type: 'link' as const, item })),
    ...pinnedCredentials.map((item) => ({ type: 'credential' as const, item })),
    ...pinnedNotes.map((item) => ({ type: 'note' as const, item })),
  ];

  // Sort by pinOrder, then by createdAt
  allPinnedItems.sort((a, b) => {
    const orderA = a.item.pinOrder ?? 999999;
    const orderB = b.item.pinOrder ?? 999999;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
  });

  const totalCount = allPinnedItems.length;

  const handleItemClick = (pinnedItem: PinnedItem) => {
    if (pinnedItem.type === 'link') {
      window.open(pinnedItem.item.url, '_blank', 'noopener,noreferrer');
    } else if (pinnedItem.type === 'credential') {
      pinProtectedAction(pinnedItem.item.id);
    } else if (pinnedItem.type === 'note') {
      setViewingNote(pinnedItem.item);
    }
  };

  const handleUnpin = (pinnedItem: PinnedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinnedItem.type === 'link') {
      onUnpinLink(pinnedItem.item.id);
    } else if (pinnedItem.type === 'credential') {
      onUnpinCredential(pinnedItem.item.id);
    } else if (pinnedItem.type === 'note') {
      onUnpinNote(pinnedItem.item.id);
    }
  };

  const getIcon = (type: PinnedItem['type']) => {
    switch (type) {
      case 'link':
        return <ExternalLink style={{ width: '1rem', height: '1rem' }} />;
      case 'credential':
        return <Key style={{ width: '1rem', height: '1rem' }} />;
      case 'note':
        return <FileText style={{ width: '1rem', height: '1rem' }} />;
    }
  };

  const getItemName = (pinnedItem: PinnedItem) => {
    if (pinnedItem.type === 'note') {
      return pinnedItem.item.title;
    }
    return pinnedItem.item.name;
  };

  const getActionLabel = (type: PinnedItem['type']) => {
    switch (type) {
      case 'link':
        return 'Open';
      case 'credential':
        return 'Copy';
      case 'note':
        return 'View';
    }
  };

  return (
    <div className={dialogStyles.section}>
      <div className={dialogStyles.sectionHeader}>
        <h2 className={dialogStyles.sectionTitle}>
          <Star style={{ width: '1.25rem', height: '1.25rem', fill: '#facc15', color: '#facc15', marginRight: '0.5rem' }} />
          Pinned Items ({totalCount})
        </h2>
      </div>

      {totalCount === 0 ? (
        <div className={dialogStyles.emptyState}>
          <div className={dialogStyles.emptyIcon}>
            <Star style={{ width: '1.5rem', height: '1.5rem', color: 'var(--color-muted-foreground)' }} />
          </div>
          <h3 className={dialogStyles.emptyTitle}>No pinned items</h3>
          <p className={dialogStyles.emptyDescription}>
            Pin your favorite links, credentials, and notes for quick access
          </p>
        </div>
      ) : (
        <div className={styles.pinnedGrid}>
          {allPinnedItems.map((pinnedItem) => (
            <div
              key={`${pinnedItem.type}-${pinnedItem.item.id}`}
              className={styles.pinnedCard}
              onClick={() => handleItemClick(pinnedItem)}
            >
              <div className={styles.cardHeader}>
                <span
                  className={styles.typeBadge}
                  data-type={pinnedItem.type}
                >
                  {getIcon(pinnedItem.type)}
                  {pinnedItem.type}
                </span>
                <button
                  className={styles.unpinButton}
                  onClick={(e) => handleUnpin(pinnedItem, e)}
                  title="Unpin"
                >
                  <Star style={{ width: '1rem', height: '1rem', fill: '#facc15', color: '#facc15' }} />
                </button>
              </div>

              <div className={styles.cardContent}>
                <h4 className={styles.itemName}>{getItemName(pinnedItem)}</h4>
                <span
                  className={styles.categoryBadge}
                  style={{
                    backgroundColor: colorMap[pinnedItem.item.category] ? `${colorMap[pinnedItem.item.category]}20` : 'var(--color-muted)',
                    color: colorMap[pinnedItem.item.category] || 'var(--color-foreground)',
                  }}
                >
                  {pinnedItem.item.category}
                </span>
              </div>

              <div className={styles.cardAction}>
                <span className={styles.actionLabel}>{getActionLabel(pinnedItem.type)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        mode={pinModalMode}
      />

      {/* View Note Modal */}
      <ViewNoteModal
        note={viewingNote}
        onClose={() => setViewingNote(null)}
      />
    </div>
  );
}
