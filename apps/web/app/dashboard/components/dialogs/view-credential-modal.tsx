'use client';

import { Button } from '@/components/ui/button';
import { X, Copy, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { copySecureToClipboard } from '@/lib/clipboard';
import { trpc } from '@/lib/trpc/react';
import styles from '../cards/card.module.css';
import dialogStyles from './dialog.module.css';

interface ViewCredentialModalProps {
  credential: {
    id: string;
    name: string;
    category: string;
    data: string;
  } | null;
  onClose: () => void;
}

export function ViewCredentialModal({ credential, onClose }: ViewCredentialModalProps) {
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

          <div className={styles.securityBadge}>
            <Shield />
            <span>This data was encrypted with AES-256-GCM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
