'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/react';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: sessionData, isLoading } = trpc.auth.getSession.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: (data) => {
      document.cookie = data.sessionCookie;
      router.push('/auth/login');
    },
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Links
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your important links and bookmarks
            </p>
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Coming soon...
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Credentials
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Securely store your passwords and API keys
            </p>
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Coming soon...
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
