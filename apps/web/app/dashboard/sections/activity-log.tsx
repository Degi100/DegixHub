'use client';

import { trpc } from '@/lib/trpc/react';
import { useRouter } from 'next/navigation';
import styles from './activity-log.module.css';

interface ActivityLogProps {
  limit?: number;
  onNavigateToSection?: (section: string) => void;
}

export function ActivityLog({ limit = 20, onNavigateToSection }: ActivityLogProps) {
  const router = useRouter();
  const { data: activities, isLoading } = trpc.activityLogs.getAll.useQuery({
    limit: limit.toString(),
  });

  // Fetch link by ID when needed
  const { data: links } = trpc.links.getAll.useQuery();
  const { data: credentials } = trpc.credentials.getAll.useQuery();

  const getActionSymbol = (action: string) => {
    if (action === 'created') return '+';
    if (action === 'updated') return '~';
    if (action === 'deleted') return '-';
    if (action === 'viewed') return '>';
    if (action === 'copied') return '⎘';
    if (action === 'pinned') return '★';
    if (action === 'unpinned') return '☆';
    return '•';
  };

  const getActionClass = (action: string) => {
    if (action === 'created') return styles['actionSymbol--created'];
    if (action === 'updated') return styles['actionSymbol--updated'];
    if (action === 'deleted') return styles['actionSymbol--deleted'];
    if (action === 'viewed') return styles['actionSymbol--viewed'];
    if (action === 'copied') return styles['actionSymbol--copied'];
    if (action === 'pinned') return styles['actionSymbol--pinned'];
    if (action === 'unpinned') return styles['actionSymbol--unpinned'];
    return styles['actionSymbol--default'];
  };

  const getResourceTypeSymbol = (resourceType: string) => {
    if (resourceType === 'credential') return 'cred';
    if (resourceType === 'link') return 'link';
    if (resourceType === 'note') return 'note';
    if (resourceType === 'tag') return 'tag';
    return 'item';
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return '<1m';
  };

  const getDateGroup = (date: Date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

    if (activityDay.getTime() === today.getTime()) return 'Today';
    if (activityDay.getTime() === yesterday.getTime()) return 'Yesterday';
    if (activityDay.getTime() > lastWeek.getTime()) return 'Last 7 days';
    return 'Older';
  };

  const groupActivitiesByDate = (activities: any[]) => {
    const groups: { [key: string]: any[] } = {};
    activities.forEach((activity) => {
      const group = getDateGroup(activity.createdAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(activity);
    });
    return groups;
  };

  const handleActivityClick = (activity: any) => {
    // Handle direct actions based on resource type
    if (activity.resourceType === 'link' && activity.resourceId) {
      // Find the link and open it
      const link = links?.find((l) => l.id === activity.resourceId);
      if (link) {
        window.open(link.url, '_blank');
      } else {
        // Link doesn't exist anymore, just navigate to links section
        onNavigateToSection?.('links');
      }
    } else if (activity.resourceType === 'credential' && activity.resourceId) {
      // Navigate to credentials and trigger view modal via URL
      onNavigateToSection?.('credentials');
      // Note: This would need a more sophisticated state management
      // For now, just navigate to credentials section
      router.push(`/dashboard?section=credentials&view=${activity.resourceId}`);
    } else {
      // Fallback: just navigate to the section
      if (activity.resourceType === 'link') {
        onNavigateToSection?.('links');
      } else if (activity.resourceType === 'credential') {
        onNavigateToSection?.('credentials');
      }
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <h2 className={styles.title}>Activity Log</h2>
        <div className={styles.loadingText}>
          Loading...
        </div>
      </div>
    );
  }

  const groupedActivities = activities ? groupActivitiesByDate(activities) : {};
  const groupOrder = ['Today', 'Yesterday', 'Last 7 days', 'Older'];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Activity Log</h2>

      {activities && activities.length > 0 ? (
        <div className={styles.logContainer}>
          <div className={styles.scrollArea}>
            <div className={styles.groups}>
              {groupOrder.map((groupName) => {
                const groupActivities = groupedActivities[groupName];
                if (!groupActivities || groupActivities.length === 0) return null;

                return (
                  <div key={groupName} className={styles.dateGroup}>
                    <div className={styles.dateGroupHeader}>
                      {groupName}
                    </div>

                    {groupActivities.map((activity: any) => (
                      <div
                        key={activity.id}
                        onClick={() => handleActivityClick(activity)}
                        className={styles.activityItem}
                      >
                        <span className={styles.time}>
                          {formatTime(activity.createdAt)}
                        </span>
                        <span className={`${styles.actionSymbol} ${getActionClass(activity.action)}`}>
                          {getActionSymbol(activity.action)}
                        </span>
                        <span className={styles.resourceType}>
                          {getResourceTypeSymbol(activity.resourceType)}
                        </span>
                        <span className={styles.resourceName}>
                          {activity.resourceName}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.fadeGradient} />
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>~ no activity yet ~</p>
        </div>
      )}
    </div>
  );
}
