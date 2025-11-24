'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Eye, Copy, Trash2, Plus, Shield, X } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/react';
import styles from './card.module.css';
import dialogStyles from './dialog.module.css';

interface Credential {
  id: string;
  name: string;
  category: string;
  isPinned?: boolean | null;
  createdAt: string;
}

interface SimpleCredentialsSectionProps {
  credentials: Credential[] | undefined;
  onDeleteCredential: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCreateCredential: (data: { name: string; data: string; category: string }) => void;
}

// Credential Card Component
function CredentialCard({
  credential,
  onTogglePin,
  onView,
  onDelete,
}: {
  credential: Credential;
  onTogglePin: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const categoryClass = credential.category.toLowerCase();

  return (
    <div className={`${styles.card} ${styles[`card--${categoryClass}`]}`}>
      {/* Category Badge & Pin */}
      <div className={styles.cardHeader}>
        <span className={`${styles.categoryBadge} ${styles[`categoryBadge--${categoryClass}`]}`}>
          {credential.category}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div className={styles.securityBadge}>
            <Shield />
            <span>AES-256</span>
          </div>
          {credential.isPinned && (
            <Star className={styles.pinIcon} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`${styles.cardContent} ${styles.credentialContent}`}>
        <h4 className={styles.cardTitle}>{credential.name}</h4>
        <p className={styles.passwordDots}>••••••••</p>
      </div>

      {/* Actions */}
      <div className={styles.cardActions}>
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

export function SimpleCredentialsSection({
  credentials,
  onDeleteCredential,
  onTogglePin,
  onCreateCredential,
}: SimpleCredentialsSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    data: '',
    category: 'General',
  });

  // Fetch credential data when viewing
  const { data: viewedCredential } = trpc.credentials.getById.useQuery(
    { id: viewingId! },
    { enabled: !!viewingId }
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const pinnedCredentials = credentials?.filter(c => c.isPinned).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unpinnedCredentials = credentials?.filter(c => !c.isPinned).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateCredential(formData);
    setFormData({ name: '', data: '', category: 'General' });
    setShowDialog(false);
  };

  return (
    <div className={dialogStyles.section}>
      <div className={dialogStyles.sectionHeader}>
        <h2 className={dialogStyles.sectionTitle}>Credentials</h2>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
          Add Credential
        </Button>
      </div>

      {/* Add Credential Dialog */}
      {showDialog && (
        <div className={dialogStyles.overlay}>
          <div className={dialogStyles.dialog}>
            <div className={dialogStyles.dialogHeader}>
              <h3 className={dialogStyles.dialogTitle}>Add New Credential</h3>
              <button onClick={() => setShowDialog(false)} className={dialogStyles.closeButton}>
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className={dialogStyles.form}>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={dialogStyles.input}
                />
              </div>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Password/Secret *</label>
                <input
                  type="password"
                  required
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className={dialogStyles.input}
                />
              </div>
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={dialogStyles.input}
                />
              </div>
              <div className={dialogStyles.formActions}>
                <Button type="submit" style={{ flex: 1 }}>Add Credential</Button>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pinned Credentials */}
      {pinnedCredentials && pinnedCredentials.length > 0 && (
        <div className={dialogStyles.cardSection}>
          <h3 className={dialogStyles.subsectionTitle}>
            <Star className={styles.pinIcon} />
            Pinned ({pinnedCredentials.length})
          </h3>
          <div className={dialogStyles.grid}>
            {pinnedCredentials.map((cred) => (
              <CredentialCard
                key={cred.id}
                credential={cred}
                onTogglePin={onTogglePin}
                onView={(id) => setViewingId(viewingId === id ? null : id)}
                onDelete={onDeleteCredential}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Credentials */}
      {unpinnedCredentials && unpinnedCredentials.length > 0 && (
        <div className={dialogStyles.cardSection}>
          {pinnedCredentials && pinnedCredentials.length > 0 && (
            <h3 className={dialogStyles.subsectionTitle}>
              All Credentials ({unpinnedCredentials.length})
            </h3>
          )}
          <div className={dialogStyles.grid}>
            {unpinnedCredentials.map((cred) => (
              <CredentialCard
                key={cred.id}
                credential={cred}
                onTogglePin={onTogglePin}
                onView={(id) => setViewingId(viewingId === id ? null : id)}
                onDelete={onDeleteCredential}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!credentials || credentials.length === 0) && (
        <div className={dialogStyles.emptyState}>
          <div className={dialogStyles.emptyIcon}>
            <Shield style={{ width: '1.5rem', height: '1.5rem', color: 'var(--color-muted-foreground)' }} />
          </div>
          <h3 className={dialogStyles.emptyTitle}>No credentials yet</h3>
          <p className={dialogStyles.emptyDescription}>
            Securely store your passwords and secrets
          </p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
            Add Credential
          </Button>
        </div>
      )}

      {/* View Credential Modal */}
      {viewingId && viewedCredential && (
        <div className={dialogStyles.overlay}>
          <div className={`${dialogStyles.dialog} ${dialogStyles.viewModal}`}>
            <div className={dialogStyles.dialogHeader}>
              <div>
                <h3 className={dialogStyles.dialogTitle}>{viewedCredential.name}</h3>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted-foreground)' }}>
                  {viewedCredential.category}
                </span>
              </div>
              <button
                onClick={() => setViewingId(null)}
                className={dialogStyles.closeButton}
              >
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>

            <div className={dialogStyles.viewContent}>
              <div className={dialogStyles.dataDisplay}>
                <div className={dialogStyles.dataHeader}>
                  <label>Decrypted Data</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(viewedCredential.data)}
                  >
                    <Copy style={{ width: '0.75rem', height: '0.75rem', marginRight: 'var(--space-2)' }} />
                    Copy
                  </Button>
                </div>
                <pre className={dialogStyles.dataContent}>
                  {viewedCredential.data}
                </pre>
              </div>

              <div className={styles.securityBadge}>
                <Shield />
                <span>This data was encrypted with AES-256-GCM</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
