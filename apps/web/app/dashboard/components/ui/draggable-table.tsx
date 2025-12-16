'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  render: (item: T) => ReactNode;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface DraggableTableProps<T extends { id: string; isPinned?: boolean | null }> {
  items: T[];
  columns: Column<T>[];
  onReorder: (items: { id: string; pinOrder: number }[]) => void;
  renderActions: (item: T) => ReactNode;
  hasMoreToLoad?: boolean;
  remainingCount?: number;
  onLoadMore?: () => void;
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
}

export function DraggableTable<T extends { id: string; isPinned?: boolean | null }>({
  items,
  columns,
  onReorder,
  renderActions,
  hasMoreToLoad = false,
  remainingCount = 0,
  onLoadMore,
  sortConfig,
  onSort,
}: DraggableTableProps<T>) {
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-light, rgba(59, 130, 246, 0.1))';
  };

  const handleDragLeave = (e: React.DragEvent, isPinned: boolean) => {
    (e.currentTarget as HTMLElement).style.background = isPinned
      ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0.05) 100%)'
      : 'transparent';
  };

  const handleDrop = (e: React.DragEvent, targetId: string, isPinned: boolean) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).style.background = isPinned
      ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0.05) 100%)'
      : 'transparent';

    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetId) {
      const draggedIndex = items.findIndex(item => item.id === draggedId);
      const targetIndex = items.findIndex(item => item.id === targetId);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newItems = [...items];
        const [draggedItem] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, draggedItem);
        const updatedOrders = newItems.map((item, idx) => ({ id: item.id, pinOrder: idx }));
        onReorder(updatedOrders);
      }
    }
  };

  const getRowBackground = (isPinned: boolean, hover = false) => {
    if (isPinned) {
      return hover
        ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.2) 0%, rgba(250, 204, 21, 0.1) 100%)'
        : 'linear-gradient(90deg, rgba(250, 204, 21, 0.15) 0%, rgba(250, 204, 21, 0.05) 100%)';
    }
    return hover ? 'var(--color-muted)' : 'transparent';
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-2)' }}>
        Drag rows to reorder
      </p>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 'var(--text-sm)',
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--color-muted-foreground)', width: '30px' }}></th>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable && onSort?.(col.key)}
                style={{
                  padding: 'var(--space-3)',
                  textAlign: col.align || 'left',
                  fontWeight: 600,
                  color: sortConfig?.key === col.key ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                  width: col.width,
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {col.header}
                  {col.sortable && sortConfig?.key === col.key && (
                    sortConfig.direction === 'asc'
                      ? <ChevronUp style={{ width: '14px', height: '14px' }} />
                      : <ChevronDown style={{ width: '14px', height: '14px' }} />
                  )}
                </span>
              </th>
            ))}
            <th style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600, color: 'var(--color-muted-foreground)' }}>
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isPinned = !!item.isPinned;
            return (
              <tr
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={(e) => handleDragLeave(e, isPinned)}
                onDrop={(e) => handleDrop(e, item.id, isPinned)}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: getRowBackground(isPinned),
                  borderLeft: isPinned ? '3px solid #facc15' : '3px solid transparent',
                  cursor: 'grab',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = getRowBackground(isPinned, true)}
                onMouseLeave={(e) => e.currentTarget.style.background = getRowBackground(isPinned)}
              >
                <td style={{ padding: 'var(--space-2)', color: 'var(--color-muted-foreground)', cursor: 'grab' }}>
                  ⋮⋮
                </td>
                {columns.map(col => (
                  <td
                    key={col.key}
                    style={{
                      padding: 'var(--space-3)',
                      textAlign: col.align || 'left',
                    }}
                  >
                    {col.render(item)}
                  </td>
                ))}
                <td style={{ padding: 'var(--space-2)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                    {renderActions(item)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasMoreToLoad && onLoadMore && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <Button variant="outline" onClick={onLoadMore}>
            Load More ({remainingCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
