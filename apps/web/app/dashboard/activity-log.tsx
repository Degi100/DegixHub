'use client';

import { trpc } from '@/lib/trpc/react';

interface ActivityLogProps {
  limit?: number;
}

export function ActivityLog({ limit = 20 }: ActivityLogProps) {
  const { data: activities, isLoading } = trpc.activityLogs.getAll.useQuery({
    limit: limit.toString(),
  });

  const getActivityIcon = (action: string, resourceType: string) => {
    if (action === 'created') {
      return (
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
    }
    if (action === 'updated') {
      return (
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
    if (action === 'deleted') {
      return (
        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    }
    if (action === 'viewed') {
      return (
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    }
    return null;
  };

  const getResourceTypeIcon = (resourceType: string) => {
    if (resourceType === 'credential') {
      return '🔒';
    }
    if (resourceType === 'link') {
      return '🔗';
    }
    if (resourceType === 'tag') {
      return '🏷️';
    }
    return '📝';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const getActionText = (action: string, resourceType: string, resourceName: string) => {
    const typeLabel = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
    return `${action.charAt(0).toUpperCase() + action.slice(1)} ${typeLabel}: "${resourceName}"`;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Activity Log</h2>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Loading activity...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Activity Log</h2>

      {activities && activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity: any) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.action, activity.resourceType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getResourceTypeIcon(activity.resourceType)}</span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getActionText(activity.action, activity.resourceType, activity.resourceName)}
                  </p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No activity yet. Start by creating some credentials or links!
        </div>
      )}
    </div>
  );
}
