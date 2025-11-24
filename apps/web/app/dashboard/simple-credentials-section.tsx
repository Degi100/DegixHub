'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star, Eye, Copy, Trash2, Plus, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Credential {
  id: string;
  name: string;
  category: string;
  isPinned?: boolean | null;
  createdAt: string;
  tags: Tag[];
}

interface SimpleCredentialsSectionProps {
  credentials: Credential[] | undefined;
  onDeleteCredential: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCreateCredential: (data: { name: string; data: string; category: string }) => void;
}

export function SimpleCredentialsSection({
  credentials,
  onDeleteCredential,
  onTogglePin,
  onCreateCredential,
}: SimpleCredentialsSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    data: '',
    category: 'General',
  });

  const sortedCredentials = credentials?.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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

      <div className="border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-sm">Name</th>
              <th className="text-left p-3 font-medium text-sm">Category</th>
              <th className="text-left p-3 font-medium text-sm">Tags</th>
              <th className="text-left p-3 font-medium text-sm">Security</th>
              <th className="text-right p-3 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCredentials && sortedCredentials.length > 0 ? (
              sortedCredentials.map((cred) => (
                <tr key={cred.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {cred.isPinned && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                      <span className="font-medium">{cred.name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-muted-foreground">{cred.category}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {cred.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-block px-2 py-0.5 text-xs rounded"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <Shield className="h-3 w-3" />
                      AES-256
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onTogglePin(cred.id)}
                      >
                        <Star
                          className={cn(
                            'h-4 w-4',
                            cred.isPinned ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                          )}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toast.info('View credential')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toast.success('Copied to clipboard')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm('Delete this credential?')) {
                            onDeleteCredential(cred.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No credentials yet. Click "Add Credential" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
