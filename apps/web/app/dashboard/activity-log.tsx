'use client';

import { trpc } from '@/lib/trpc/react';
import { useRouter } from 'next/navigation';

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
    if (action === 'pinned') return '★';
    if (action === 'unpinned') return '☆';
    return '•';
  };

  const getActionColor = (action: string) => {
    if (action === 'created') return 'text-green-500';
    if (action === 'updated') return 'text-blue-500';
    if (action === 'deleted') return 'text-red-500';
    if (action === 'viewed') return 'text-gray-400';
    if (action === 'pinned') return 'text-yellow-500';
    if (action === 'unpinned') return 'text-gray-400';
    return 'text-gray-500';
  };

  const getResourceTypeSymbol = (resourceType: string) => {
    if (resourceType === 'credential') return 'cred';
    if (resourceType === 'link') return 'link';
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
      <div className="space-y-3">
        <h2 className="text-2xl font-bold">Activity Log</h2>
        <div className="text-muted-foreground text-sm font-mono">
          Loading...
        </div>
      </div>
    );
  }

  const groupedActivities = activities ? groupActivitiesByDate(activities) : {};
  const groupOrder = ['Today', 'Yesterday', 'Last 7 days', 'Older'];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Activity Log</h2>

      {activities && activities.length > 0 ? (
        <div className="bg-black/5 dark:bg-white/5 rounded-lg border border-border/50 p-4 font-mono text-sm relative">
          {/* Custom scrollbar styles */}
          <style jsx>{`
            .activity-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .activity-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .activity-scroll::-webkit-scrollbar-thumb {
              background: hsl(var(--muted-foreground) / 0.3);
              border-radius: 3px;
            }
            .activity-scroll::-webkit-scrollbar-thumb:hover {
              background: hsl(var(--muted-foreground) / 0.5);
            }
          `}</style>

          <div className="activity-scroll space-y-4 max-h-[500px] overflow-y-auto pr-2 relative">
            {groupOrder.map((groupName) => {
              const groupActivities = groupedActivities[groupName];
              if (!groupActivities || groupActivities.length === 0) return null;

              return (
                <div key={groupName} className="space-y-0.5">
                  {/* Date group header */}
                  <div className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-2">
                    {groupName}
                  </div>

                  {groupActivities.map((activity: any) => (
                    <div
                      key={activity.id}
                      onClick={() => handleActivityClick(activity)}
                      className="flex items-center gap-3 py-1.5 px-2 -mx-2 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors cursor-pointer"
                    >
                      <span className="text-muted-foreground/60 text-xs w-10 text-right shrink-0 tabular-nums">
                        {formatTime(activity.createdAt)}
                      </span>
                      <span className={`${getActionColor(activity.action)} font-bold w-5 text-center shrink-0`}>
                        {getActionSymbol(activity.action)}
                      </span>
                      <span className="text-muted-foreground/80 text-xs shrink-0 min-w-[2.5rem]">
                        {getResourceTypeSymbol(activity.resourceType)}
                      </span>
                      <span className="text-foreground/90 truncate">
                        {activity.resourceName}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Fade-out gradient at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/5 dark:from-white/5 to-transparent pointer-events-none rounded-b-lg" />
        </div>
      ) : (
        <div className="bg-black/5 dark:bg-white/5 rounded-lg border border-border/50 p-8 text-center">
          <p className="text-muted-foreground text-sm font-mono">~ no activity yet ~</p>
        </div>
      )}
    </div>
  );
}
