'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/react';
import { Sidebar } from '@/components/sidebar';
import { CommandPalette } from './command-palette';
import { SimpleLinksSection } from './simple-links-section';
import { SimpleCredentialsSection } from './simple-credentials-section';
import { NotesSection } from './notes-section';
import { ActivityLog } from './activity-log';
import { DataManagement } from './data-management';
import { SettingsSection } from './settings-section';
import { PinProvider } from './pin-context';
import { toast } from 'sonner';
import styles from './page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('links');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingNoteLink, setPendingNoteLink] = useState<string | null>(null);
  const [pendingNoteCredential, setPendingNoteCredential] = useState<string | null>(null);

  // Session check
  const { data: session, isLoading: sessionLoading } = trpc.auth.getSession.useQuery();

  // Fetch data
  const { data: links, refetch: refetchLinks } = trpc.links.getAll.useQuery();
  const { data: credentials, refetch: refetchCredentials } = trpc.credentials.getAll.useQuery();
  const { data: notes, refetch: refetchNotes } = trpc.notes.getAll.useQuery();
  const { data: categoriesData, refetch: refetchCategories } = trpc.categories.getAll.useQuery();

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

  const updateCredentialMutation = trpc.credentials.update.useMutation({
    onSuccess: () => {
      refetchCredentials();
      toast.success('Credential updated');
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

  // Note Mutations
  const createNoteMutation = trpc.notes.create.useMutation({
    onSuccess: () => {
      refetchNotes();
      toast.success('Note created');
    },
  });

  const updateNoteMutation = trpc.notes.update.useMutation({
    onSuccess: () => {
      refetchNotes();
      toast.success('Note updated');
    },
  });

  const toggleNotePinMutation = trpc.notes.togglePin.useMutation({
    onSuccess: () => {
      refetchNotes();
      toast.success('Note updated');
    },
  });

  const deleteNoteMutation = trpc.notes.delete.useMutation({
    onSuccess: () => {
      refetchNotes();
      toast.success('Note deleted');
    },
  });

  // Category Mutation
  const createCategoryMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      refetchCategories();
      toast.success('Category added');
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
    notesCount: notes?.length || 0,
    tagsCount: 0,
    pinnedCount:
      (links?.filter((l) => l.isPinned).length || 0) +
      (credentials?.filter((c) => c.isPinned).length || 0) +
      (notes?.filter((n) => n.isPinned).length || 0),
  };

  // Calculate notes count and notes list by linked resource
  const notesCountByLinkId: Record<string, number> = {};
  const notesCountByCredentialId: Record<string, number> = {};
  const notesByLinkId: Record<string, { id: string; title: string; content: string }[]> = {};
  const notesByCredentialId: Record<string, { id: string; title: string; content: string }[]> = {};

  notes?.forEach((note) => {
    if (note.linkedLinkId) {
      notesCountByLinkId[note.linkedLinkId] = (notesCountByLinkId[note.linkedLinkId] || 0) + 1;
      if (!notesByLinkId[note.linkedLinkId]) notesByLinkId[note.linkedLinkId] = [];
      notesByLinkId[note.linkedLinkId].push({ id: note.id, title: note.title, content: note.content });
    }
    if (note.linkedCredentialId) {
      notesCountByCredentialId[note.linkedCredentialId] = (notesCountByCredentialId[note.linkedCredentialId] || 0) + 1;
      if (!notesByCredentialId[note.linkedCredentialId]) notesByCredentialId[note.linkedCredentialId] = [];
      notesByCredentialId[note.linkedCredentialId].push({ id: note.id, title: note.title, content: note.content });
    }
  });

  // Handler for adding note from Link/Credential
  const handleAddNoteFromLink = (linkId: string) => {
    setPendingNoteLink(linkId);
    setPendingNoteCredential(null);
    setActiveSection('notes');
  };

  const handleAddNoteFromCredential = (credentialId: string) => {
    setPendingNoteCredential(credentialId);
    setPendingNoteLink(null);
    setActiveSection('notes');
  };

  return (
    <PinProvider>
      <div className={styles.dashboard}>
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onNavigate={setActiveSection}
          onLogout={() => logoutMutation.mutate()}
          stats={stats}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className={styles.main}>
          {/* Header with Search */}
          <div className={styles.searchHeader}>
            {/* Burger Menu Button (Mobile only) */}
            <button
              className={styles.burgerButton}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

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
                categories={categoriesData?.categories || []}
                colorMap={categoriesData?.colorMap || {}}
                onAddCategory={async (name, color) => {
                  await createCategoryMutation.mutateAsync({ name, color });
                }}
                onAddNote={handleAddNoteFromLink}
                notesCountByLinkId={notesCountByLinkId}
                notesByLinkId={notesByLinkId}
                credentials={credentials?.map(c => ({ id: c.id, name: c.name }))}
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
                onUpdateCredential={(data) => updateCredentialMutation.mutate(data)}
                categories={categoriesData?.categories || []}
                colorMap={categoriesData?.colorMap || {}}
                onAddCategory={async (name, color) => {
                  await createCategoryMutation.mutateAsync({ name, color });
                }}
                onAddNote={handleAddNoteFromCredential}
                notesCountByCredentialId={notesCountByCredentialId}
                notesByCredentialId={notesByCredentialId}
              />
            )}

            {activeSection === 'notes' && (
              <NotesSection
                notes={notes || []}
                searchQuery={searchQuery}
                links={links?.map(l => ({ id: l.id, name: l.name, url: l.url }))}
                credentials={credentials?.map(c => ({ id: c.id, name: c.name }))}
                onCreate={(data) => {
                  createNoteMutation.mutate(data);
                  setPendingNoteLink(null);
                  setPendingNoteCredential(null);
                }}
                onUpdate={(id, data) => {
                  const cleanData: any = { ...data };
                  if (cleanData.isPinned === null) cleanData.isPinned = undefined;
                  if (cleanData.linkedLinkId === null) cleanData.linkedLinkId = undefined;
                  if (cleanData.linkedCredentialId === null) cleanData.linkedCredentialId = undefined;
                  updateNoteMutation.mutate({ id, ...cleanData });
                }}
                onDelete={(id) => deleteNoteMutation.mutate({ id })}
                onTogglePin={(id) => toggleNotePinMutation.mutate({ id })}
                categories={categoriesData?.categories || []}
                colorMap={categoriesData?.colorMap || {}}
                onAddCategory={async (name, color) => {
                  await createCategoryMutation.mutateAsync({ name, color });
                }}
                pendingLinkId={pendingNoteLink}
                pendingCredentialId={pendingNoteCredential}
                onClearPending={() => {
                  setPendingNoteLink(null);
                  setPendingNoteCredential(null);
                }}
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

            {activeSection === 'settings' && (
              <SettingsSection />
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
    </PinProvider>
  );
}
