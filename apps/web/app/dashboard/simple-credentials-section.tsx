'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Eye, Copy, Trash2, Plus, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/react';

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

// Category color mapping (same as links)
const categoryColors: Record<string, string> = {
  General: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  Work: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Personal: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  Development: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  Design: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  Banking: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  Social: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  Entertainment: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  Shopping: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  Email: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
};

// Category accent colors for card borders (with !important to override global border-color)
const categoryAccents: Record<string, string> = {
  General: 'hover:!border-gray-500/50',
  Work: 'hover:!border-blue-500/50',
  Personal: 'hover:!border-purple-500/50',
  Development: 'hover:!border-green-500/50',
  Design: 'hover:!border-pink-500/50',
  Banking: 'hover:!border-emerald-500/50',
  Social: 'hover:!border-cyan-500/50',
  Entertainment: 'hover:!border-orange-500/50',
  Shopping: 'hover:!border-red-500/50',
  Email: 'hover:!border-indigo-500/50',
};

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
  const categoryColor = categoryColors[credential.category] || categoryColors.General;
  const categoryAccent = categoryAccents[credential.category] || categoryAccents.General;

  return (
    <div className={cn(
      'group relative bg-card border-2 border-border rounded-lg p-4 hover:shadow-xl transition-all duration-200',
      categoryAccent
    )}>
      {/* Category Badge & Pin */}
      <div className="flex items-center justify-between mb-3">
        <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold border', categoryColor)}>
          {credential.category}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <Shield className="h-3 w-3" />
            <span className="hidden sm:inline">AES-256</span>
          </div>
          {credential.isPinned && (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4 min-h-[60px]">
        <h4 className="font-bold text-base mb-2 line-clamp-1 group-hover:text-primary transition-colors">{credential.name}</h4>
        <p className="text-sm text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded inline-block">••••••••</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onTogglePin(credential.id)}
          title={credential.isPinned ? 'Unpin' : 'Pin'}
        >
          <Star
            className={cn(
              'h-4 w-4',
              credential.isPinned ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            )}
          />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView(credential.id)}
          title="View credential"
        >
          <Eye className={cn('h-4 w-4')} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (confirm('Delete this credential?')) {
              onDelete(credential.id);
            }
          }}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Credentials</h2>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Credential
        </Button>
      </div>

      {/* Add Credential Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Add New Credential</h3>
              <button onClick={() => setShowDialog(false)} className="hover:bg-muted rounded p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/50 rounded-md border border-border focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password/Secret *</label>
                <input
                  type="password"
                  required
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/50 rounded-md border border-border focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/50 rounded-md border border-border focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">Add Credential</Button>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pinned Credentials */}
      {pinnedCredentials && pinnedCredentials.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            Pinned ({pinnedCredentials.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="space-y-3">
          {pinnedCredentials && pinnedCredentials.length > 0 && (
            <h3 className="text-sm font-semibold text-muted-foreground">
              All Credentials ({unpinnedCredentials.length})
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No credentials yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Securely store your passwords and secrets
          </p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Credential
          </Button>
        </div>
      )}

      {/* View Credential Modal */}
      {viewingId && viewedCredential && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold">{viewedCredential.name}</h3>
                <span className="text-sm text-muted-foreground">{viewedCredential.category}</span>
              </div>
              <button
                onClick={() => setViewingId(null)}
                className="hover:bg-muted rounded p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Decrypted Data</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(viewedCredential.data)}
                  >
                    <Copy className="h-3 w-3 mr-2" />
                    Copy
                  </Button>
                </div>
                <pre className="text-sm font-mono whitespace-pre-wrap break-all bg-background p-3 rounded border border-border">
                  {viewedCredential.data}
                </pre>
              </div>

              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <Shield className="h-3 w-3" />
                <span>This data was encrypted with AES-256-GCM</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
