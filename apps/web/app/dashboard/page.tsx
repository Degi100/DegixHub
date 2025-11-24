'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/react';
import { Sidebar } from '@/components/sidebar';
import { CommandPalette } from './command-palette';
import { SimpleLinksSection } from './simple-links-section';
import { SimpleCredentialsSection } from './simple-credentials-section';
import { ActivityLog } from './activity-log';
import { DataManagement } from './data-management';
import { toast } from 'sonner';
import styles from './page.module.css';

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
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const stats = {
    linksCount: links?.length || 0,
    credentialsCount: credentials?.length || 0,
    tagsCount: 0,
    pinnedCount: (links?.filter((l) => l.isPinned).length || 0) + (credentials?.filter((c) => c.isPinned).length || 0),
  };

  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onLogout={() => logoutMutation.mutate()}
        stats={stats}
      />

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header with Search */}
        <div className={styles.searchHeader}>
          <input
            type="text"
            placeholder="Search credentials and links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.content}>
          {/* Content Sections */}
          {activeSection === 'links' && (
            <SimpleLinksSection
              links={links?.filter((link) => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  link.name.toLowerCase().includes(query) ||
                  link.url.toLowerCase().includes(query) ||
                  link.category.toLowerCase().includes(query)
                );
              })}
              onDeleteLink={(id) => deleteLinkMutation.mutate({ id })}
              onTogglePin={(id) => toggleLinkPinMutation.mutate({ id })}
              onCreateLink={(data) => createLinkMutation.mutate(data)}
              onUpdateLink={(data) => updateLinkMutation.mutate(data)}
            />
          )}

          {activeSection === 'credentials' && (
            <SimpleCredentialsSection
              credentials={credentials?.filter((cred) => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  cred.name.toLowerCase().includes(query) ||
                  cred.category.toLowerCase().includes(query)
                );
              })}
              onDeleteCredential={(id) => deleteCredentialMutation.mutate({ id })}
              onTogglePin={(id) => toggleCredentialPinMutation.mutate({ id })}
              onCreateCredential={(data) => createCredentialMutation.mutate(data)}
            />
          )}

          {activeSection === 'tags' && (
            <div style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-card)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Tags</h2>
              <p style={{ color: 'var(--color-muted-foreground)' }}>Tags management coming soon...</p>
            </div>
          )}

          {activeSection === 'activity' && (
            <ActivityLog
              limit={50}
              onNavigateToSection={setActiveSection}
            />
          )}

          {activeSection === 'data-management' && (
            <DataManagement />
          )}
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
