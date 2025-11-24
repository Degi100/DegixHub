'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Link as LinkIcon,
  Key,
  Activity,
  LogOut,
  Moon,
  Sun,
  Database,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface SidebarProps {
  onNavigate: (section: 'links' | 'credentials' | 'activity' | 'data-management') => void;
  activeSection: string;
  onLogout: () => void;
  stats: {
    linksCount: number;
    credentialsCount: number;
    tagsCount: number;
    pinnedCount: number;
  };
}

export function Sidebar({ onNavigate, activeSection, onLogout, stats }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const navItems = [
    { id: 'links', label: 'Links', icon: LinkIcon, count: stats.linksCount },
    { id: 'credentials', label: 'Credentials', icon: Key, count: stats.credentialsCount },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'data-management', label: 'Data', icon: Database },
  ];

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold">DegixHub</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {stats.pinnedCount} pinned items
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className="text-xs text-muted-foreground">{item.count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 space-y-1">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>Toggle theme</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-destructive/10 text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
