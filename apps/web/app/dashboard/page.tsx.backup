'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import { CredentialsSection } from './credentials-section';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { data: sessionData, isLoading } = trpc.auth.getSession.useQuery();
  const { data: links, refetch: refetchLinks } = trpc.links.getAll.useQuery(undefined, {
    enabled: !!sessionData?.user,
  });
  const { data: credentials } = trpc.credentials.getAll.useQuery(undefined, {
    enabled: !!sessionData?.user,
  });

  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [showExportImport, setShowExportImport] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    category: '',
    description: '',
  });

  const createLinkMutation = trpc.links.create.useMutation({
    onSuccess: () => {
      refetchLinks();
      setIsAddingLink(false);
      setFormData({ name: '', url: '', category: '', description: '' });
    },
  });

  const updateLinkMutation = trpc.links.update.useMutation({
    onSuccess: () => {
      refetchLinks();
      setEditingLink(null);
      setFormData({ name: '', url: '', category: '', description: '' });
    },
  });

  const deleteLinkMutation = trpc.links.delete.useMutation({
    onSuccess: () => {
      refetchLinks();
    },
  });

  const importLinksMutation = trpc.links.import.useMutation({
    onSuccess: () => {
      refetchLinks();
      alert('Links imported successfully!');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLink) {
      updateLinkMutation.mutate({ id: editingLink, ...formData });
    } else {
      createLinkMutation.mutate(formData);
    }
  };

  const handleEdit = (link: any) => {
    setEditingLink(link.id);
    setFormData({
      name: link.name,
      url: link.url,
      category: link.category,
      description: link.description || '',
    });
    setIsAddingLink(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this link?')) {
      deleteLinkMutation.mutate({ id });
    }
  };

  const handleCancel = () => {
    setIsAddingLink(false);
    setEditingLink(null);
    setFormData({ name: '', url: '', category: '', description: '' });
  };

  const filteredLinks = links?.filter((link: any) => {
    const query = linkSearchQuery.toLowerCase();
    return (
      link.name.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query) ||
      link.category.toLowerCase().includes(query) ||
      (link.description && link.description.toLowerCase().includes(query))
    );
  });

  const handleExportData = () => {
    const exportData = {
      links: links?.map((link: any) => ({
        name: link.name,
        url: link.url,
        category: link.category,
        description: link.description,
      })) || [],
      credentials: [], // Don't export encrypted credentials for security
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `degixhub-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (data.links && Array.isArray(data.links) && data.links.length > 0) {
          if (confirm(`Import ${data.links.length} links?`)) {
            importLinksMutation.mutate(data.links);
          }
        } else {
          alert('No links found in the import file');
        }
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
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
              <div className="relative">
                <button
                  onClick={() => setShowExportImport(!showExportImport)}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  title="Export/Import Data"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                {showExportImport && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <button
                      onClick={() => {
                        handleExportData();
                        setShowExportImport(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                    >
                      Export Data
                    </button>
                    <label className="block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg cursor-pointer">
                      Import Data
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Links
            </h2>
            {!isAddingLink && (
              <button
                onClick={() => setIsAddingLink(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Add Link
              </button>
            )}
          </div>

          {!isAddingLink && links && links.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search links by name, URL, category, or description..."
                  value={linkSearchQuery}
                  onChange={(e) => setLinkSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          )}

          {isAddingLink && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createLinkMutation.isPending || updateLinkMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg"
                  >
                    {editingLink ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {filteredLinks && filteredLinks.length > 0 ? (
              filteredLinks.map((link: any) => (
                <div
                  key={link.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {link.name}
                      </h3>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {link.url}
                      </a>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {link.category}
                        </span>
                      </div>
                      {link.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {link.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(link)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        disabled={deleteLinkMutation.isPending}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : linkSearchQuery && links && links.length > 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No links found matching "{linkSearchQuery}"
              </p>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No links yet. Click "Add Link" to create your first one!
              </p>
            )}
          </div>
        </div>

        <CredentialsSection />
      </main>
    </div>
  );
}
