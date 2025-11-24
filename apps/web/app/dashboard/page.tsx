'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/react';
import { Sidebar } from '@/components/sidebar';
import { CommandPalette } from './command-palette';
import { SimpleLinksSection } from './simple-links-section';
import { SimpleCredentialsSection } from './simple-credentials-section';
import { toast } from 'sonner';

export default function DashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('links');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Session check
  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();

  // Fetch data
  const { data: links, refetch: refetchLinks } = trpc.links.getAll.useQuery();
  const { data: credentials, refetch: refetchCredentials } = trpc.credentials.getAll.useQuery();
  const { data: tags, refetch: refetchTags } = trpc.tags.getAll.useQuery();

  // Link Mutations
  const createLinkMutation = trpc.links.create.useMutation({
    onSuccess: () => {
      refetchLinks();
      toast.success('Link created');
    },
  });

  const updateLinkMutation = trpc.links.update.useMutation({
    onSuccess: () => {
      refetchLinks();
      toast.success('Link updated');
    },
  });

  const toggleLinkPinMutation = trpc.links.togglePin.useMutation({
    onSuccess: () => {
      refetchLinks();
      toast.success('Link updated');
    },
  });

  const deleteLinkMutation = trpc.links.delete.useMutation({
    onSuccess: () => {
      refetchLinks();
      toast.success('Link deleted');
    },
  });

  // Credential Mutations
  const createCredentialMutation = trpc.credentials.create.useMutation({
    onSuccess: () => {
      refetchCredentials();
      toast.success('Credential created');
    },
  });

  const toggleCredentialPinMutation = trpc.credentials.togglePin.useMutation({
    onSuccess: () => {
      refetchCredentials();
      toast.success('Credential updated');
    },
  });

  const deleteCredentialMutation = trpc.credentials.delete.useMutation({
    onSuccess: () => {
      refetchCredentials();
      toast.success('Credential deleted');
    },
  });

  // Tag Mutations
  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      refetchTags();
      toast.success('Tag created');
    },
  });

  // Auth Mutation
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: (data) => {
      document.cookie = data.sessionCookie;
      router.push('/auth/login');
      toast.success('Logged out successfully');
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push('/auth/login');
    }
  }, [session, sessionLoading, router]);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const stats = {
    linksCount: links?.length || 0,
    credentialsCount: credentials?.length || 0,
    tagsCount: tags?.length || 0,
    pinnedCount: (links?.filter((l) => l.isPinned).length || 0) + (credentials?.filter((c) => c.isPinned).length || 0),
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onLogout={() => logoutMutation.mutate()}
        stats={stats}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto">
        {/* Header with Search */}
        <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
          <input
            type="text"
            placeholder="Search credentials and links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-2xl mx-auto px-4 py-2 bg-muted/50 text-sm rounded-lg border border-border focus:outline-none focus:border-primary focus:bg-background transition-colors"
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Content Sections */}
          <div className="space-y-6">
            {activeSection === 'links' && (
              <SimpleLinksSection
                links={links?.filter((link) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    link.name.toLowerCase().includes(query) ||
                    link.url.toLowerCase().includes(query) ||
                    link.category.toLowerCase().includes(query) ||
                    link.tags.some((tag) => tag.name.toLowerCase().includes(query))
                  );
                })}
                tags={tags || []}
                onDeleteLink={(id) => deleteLinkMutation.mutate({ id })}
                onTogglePin={(id) => toggleLinkPinMutation.mutate({ id })}
                onCreateLink={(data) => createLinkMutation.mutate(data)}
                onUpdateLink={(data) => updateLinkMutation.mutate(data)}
                onCreateTag={(name, color) => createTagMutation.mutate({ name, color })}
              />
            )}

            {activeSection === 'credentials' && (
              <SimpleCredentialsSection
                credentials={credentials?.filter((cred) => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    cred.name.toLowerCase().includes(query) ||
                    cred.category.toLowerCase().includes(query) ||
                    cred.tags.some((tag) => tag.name.toLowerCase().includes(query))
                  );
                })}
                onDeleteCredential={(id) => deleteCredentialMutation.mutate({ id })}
                onTogglePin={(id) => toggleCredentialPinMutation.mutate({ id })}
                onCreateCredential={(data) => createCredentialMutation.mutate(data)}
              />
            )}

            {activeSection === 'tags' && (
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">Tags</h2>
                <p className="text-muted-foreground">Tags management coming soon...</p>
              </div>
            )}

            {activeSection === 'activity' && (
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">Activity Log</h2>
                <p className="text-muted-foreground">Activity log coming soon...</p>
              </div>
            )}

            {activeSection === 'data-management' && (
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h2 className="text-2xl font-bold mb-4">Data Management</h2>
                <p className="text-muted-foreground">Import/Export coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        links={links || []}
        credentials={credentials || []}
      />
    </div>
  );
}
