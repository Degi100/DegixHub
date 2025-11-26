'use client';

import {
  Link as LinkIcon,
  Key,
  Activity,
  LogOut,
  Moon,
  Sun,
  Database,
  X,
  FileText,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import styles from './sidebar.module.css';

interface SidebarProps {
  onNavigate: (section: 'links' | 'credentials' | 'notes' | 'activity' | 'data-management') => void;
  activeSection: string;
  onLogout: () => void;
  stats: {
    linksCount: number;
    credentialsCount: number;
    notesCount: number;
    tagsCount: number;
    pinnedCount: number;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ onNavigate, activeSection, onLogout, stats, isOpen, onClose }: SidebarProps) {
  const { theme, setTheme } = useTheme();

  const navItems = [
    { id: 'links', label: 'Links', icon: LinkIcon, count: stats.linksCount },
    { id: 'credentials', label: 'Credentials', icon: Key, count: stats.credentialsCount },
    { id: 'notes', label: 'Notes', icon: FileText, count: stats.notesCount },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'data-management', label: 'Data', icon: Database },
  ];

  const handleNavigate = (section: any) => {
    onNavigate(section);
    onClose?.();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className={styles.backdrop} onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isOpen ? styles['sidebar--open'] : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>DegixHub</h1>
            <p className={styles.subtitle}>
              {stats.pinnedCount} pinned items
            </p>
          </div>
          {/* Close button for mobile */}
          <button className={styles.closeButton} onClick={onClose}>
            <X />
          </button>
        </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id as any)}
              className={`${styles.navItem} ${isActive ? styles['navItem--active'] : ''}`}
            >
              <div className={styles.navItemContent}>
                <Icon />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className={styles.navItemCount}>{item.count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={styles.footerButton}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
          <span>Toggle theme</span>
        </button>

        <button
          onClick={onLogout}
          className={`${styles.footerButton} ${styles['footerButton--logout']}`}
        >
          <LogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
}
