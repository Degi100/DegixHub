'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import { CredentialsSection } from './credentials-section';
import { LinksSection } from './links-section';
import { CommandPalette } from './command-palette';
import { ActivityLog } from './activity-log';
import { DataManagement } from './data-management';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: sessionData, isLoading } = trpc.auth.getSession.useQuery();
  const { data: links, refetch: refetchLinks } = trpc.links.getAll.useQuery(undefined, {
    enabled: !!sessionData?.user,
  });
  const { data: credentials, refetch: refetchCredentials } = trpc.credentials.getAll.useQuery(undefined, {
    enabled: !!sessionData?.user,
  });
  const { data: tags, refetch: refetchTags } = trpc.tags.getAll.useQuery(undefined, {
    enabled: !!sessionData?.user,
  });

  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const createLinkMutation = trpc.links.create.useMutation({
    onSuccess: () => {
      refetchLinks();
    },
  });

  const updateLinkMutation = trpc.links.update.useMutation({
    onSuccess: () => {
      refetchLinks();
    },
  });

  const deleteLinkMutation = trpc.links.delete.useMutation({
    onSuccess: () => {
      refetchLinks();
    },
  });

  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      refetchTags();
    },
  });

  const createCredentialMutation = trpc.credentials.create.useMutation({
    onSuccess: () => {
      refetchCredentials();
    },
  });

  const updateCredentialMutation = trpc.credentials.update.useMutation({
    onSuccess: () => {
      refetchCredentials();
    },
  });

  const deleteCredentialMutation = trpc.credentials.delete.useMutation({
    onSuccess: () => {
      refetchCredentials();
    },
  });

  const bulkDeleteLinksMutation = trpc.links.bulkDelete.useMutation({
    onSuccess: () => {
      refetchLinks();
    },
  });

  const bulkAssignLinksTagsMutation = trpc.links.bulkAssignTags.useMutation({
    onSuccess: () => {
      refetchLinks();
    },
  });

  const bulkDeleteCredentialsMutation = trpc.credentials.bulkDelete.useMutation({
    onSuccess: () => {
      refetchCredentials();
    },
  });

  const bulkAssignCredentialsTagsMutation = trpc.credentials.bulkAssignTags.useMutation({
    onSuccess: () => {
      refetchCredentials();
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: (data) => {
      document.cookie = data.sessionCookie;
      router.push('/auth/login');
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !sessionData?.user) {
      router.push('/auth/login');
    }
  }, [sessionData, isLoading, router]);

  // Global CMD+K / CTRL+K shortcut
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!sessionData?.user) {
    return null;
  }

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                DegixHub
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, {sessionData.user.username}
              </span>
              <button
                onClick={() => setShowCommandPalette(true)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                title="Quick Search (⌘K)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={() => setShowDataManagement(!showDataManagement)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                title="Data Management"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </button>
              {mounted && <ThemeToggle />}
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Links</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {links?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Credentials</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {credentials?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <LinksSection
          links={links}
          tags={tags || []}
          onCreateLink={(data) => createLinkMutation.mutate(data)}
          onUpdateLink={(data) => updateLinkMutation.mutate(data)}
          onDeleteLink={(id) => deleteLinkMutation.mutate({ id })}
          onCreateTag={(name, color) => createTagMutation.mutate({ name, color })}
          onBulkDelete={(ids) => bulkDeleteLinksMutation.mutate({ ids })}
          onBulkAssignTags={(linkIds, tagIds) => bulkAssignLinksTagsMutation.mutate({ linkIds, tagIds })}
        />

        <div className="mt-6">
          <CredentialsSection
            credentials={credentials}
            tags={tags || []}
            onCreateCredential={(data) => createCredentialMutation.mutate(data)}
            onUpdateCredential={(data) => updateCredentialMutation.mutate(data)}
            onDeleteCredential={(id) => deleteCredentialMutation.mutate({ id })}
            onCreateTag={(name, color) => createTagMutation.mutate({ name, color })}
            onBulkDelete={(ids) => bulkDeleteCredentialsMutation.mutate({ ids })}
            onBulkAssignTags={(credentialIds, tagIds) => bulkAssignCredentialsTagsMutation.mutate({ credentialIds, tagIds })}
          />
        </div>

        {showDataManagement && (
          <div className="mt-6">
            <DataManagement />
          </div>
        )}

        <div className="mt-6">
          <ActivityLog limit={15} />
        </div>
      </main>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        links={links || []}
        credentials={credentials || []}
      />
    </div>
  );
}
