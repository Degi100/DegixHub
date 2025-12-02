'use client';

import { useState, useRef, ReactNode } from 'react';

interface DraggableItem {
  id: string;
  pinOrder?: number | null;
}

interface DraggableGridProps<T extends DraggableItem> {
  items: T[];
  onReorder: (items: { id: string; pinOrder: number }[]) => void;
  renderItem: (item: T, isDragging: boolean) => ReactNode;
  className?: string;
}

export function DraggableGrid<T extends DraggableItem>({
  items,
  onReorder,
  renderItem,
  className,
}: DraggableGridProps<T>) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
    setDraggedId(id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDraggedId(null);
    setDragOverId(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragCounter.current++;
    if (id !== draggedId) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    dragCounter.current = 0;

    const draggedItemId = e.dataTransfer.getData('text/plain');
    console.log('[DraggableGrid] drop:', { draggedItemId, targetId });

    if (!draggedItemId || draggedItemId === targetId) {
      console.log('[DraggableGrid] drop cancelled - same item or no draggedId');
      return;
    }

    // Find indices
    const draggedIndex = items.findIndex((item) => item.id === draggedItemId);
    const targetIndex = items.findIndex((item) => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    // Reorder items
    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    // Update pin order for all items
    const updatedOrders = newItems.map((item, index) => ({
      id: item.id,
      pinOrder: index,
    }));

    console.log('[DraggableGrid] calling onReorder with:', updatedOrders.length, 'items');
    onReorder(updatedOrders);
    setDraggedId(null);
  };

  return (
    <div className={className}>
      {items.map((item) => (
        <div
          key={item.id}
          data-drag-id={item.id}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragEnd={handleDragEnd}
          onDragEnter={(e) => handleDragEnter(e, item.id)}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item.id)}
          style={{
            cursor: 'grab',
            transform: dragOverId === item.id ? 'scale(1.02)' : 'scale(1)',
            transition: 'transform 0.15s ease',
            outline: dragOverId === item.id ? '2px dashed var(--color-primary)' : 'none',
            outlineOffset: '2px',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ pointerEvents: draggedId ? 'none' : 'auto' }}>
            {renderItem(item, draggedId === item.id)}
          </div>
        </div>
      ))}
    </div>
  );
}
