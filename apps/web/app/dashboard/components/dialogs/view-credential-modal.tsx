'use client';

import { Button } from '@/components/ui/button';
import { X, Copy, Shield, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { copySecureToClipboard } from '@/lib/clipboard';
import { trpc } from '@/lib/trpc/react';
import styles from '../cards/card.module.css';
import dialogStyles from './dialog.module.css';

interface LinkedLink {
  id: string;
  name: string;
  url: string;
}

interface ViewCredentialModalProps {
  credential: {
    id: string;
    name: string;
    category: string;
    data: string;
    linkedLinkId?: string | null;
  } | null;
  onClose: () => void;
  linkedLink?: LinkedLink | null;
}

export function ViewCredentialModal({ credential, onClose, linkedLink }: ViewCredentialModalProps) {
  const logCopiedMutation = trpc.credentials.logCopied.useMutation();

  if (!credential) return null;

  const handleCopy = async () => {
    await copySecureToClipboard(credential.data);
    toast.success('Copied! (clears in 30s)');

    // Log the copy action
    logCopiedMutation.mutate({ id: credential.id, field: 'data' });
  };

  return (
    <div className={dialogStyles.overlay}>
      <div className={`${dialogStyles.dialog} ${dialogStyles.viewModal}`}>
        <div className={dialogStyles.dialogHeader}>
          <div>
            <h3 className={dialogStyles.dialogTitle}>{credential.name}</h3>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted-foreground)' }}>
              {credential.category}
            </span>
          </div>
          <button onClick={onClose} className={dialogStyles.closeButton}>
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>

        <div className={dialogStyles.viewContent}>
          <div className={dialogStyles.dataDisplay}>
            <div className={dialogStyles.dataHeader}>
              <label>Decrypted Data</label>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                <Copy style={{ width: '0.75rem', height: '0.75rem', marginRight: 'var(--space-2)' }} />
                Copy
              </Button>
            </div>
            <pre className={dialogStyles.dataContent}>
              {credential.data}
            </pre>
          </div>

          {linkedLink && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-2)', display: 'block' }}>
                Verknüpfter Link
              </label>
              <a
                href={linkedLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkedLinkBadge}
                style={{ display: 'inline-flex', marginTop: 0 }}
              >
                <ExternalLink style={{ width: '0.875rem', height: '0.875rem' }} />
                {linkedLink.name}
              </a>
            </div>
          )}

          <div className={styles.securityBadge}>
            <Shield />
            <span>This data was encrypted with AES-256-GCM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
