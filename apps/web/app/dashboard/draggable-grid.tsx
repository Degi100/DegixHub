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
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    // Add a slight delay to show the dragging state
    setTimeout(() => {
      const element = document.querySelector(`[data-drag-id="${id}"]`);
      if (element) {
        element.classList.add('dragging');
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    dragCounter.current = 0;
    // Remove dragging class from all elements
    document.querySelectorAll('.dragging').forEach((el) => {
      el.classList.remove('dragging');
    });
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

    if (!draggedId || draggedId === targetId) {
      return;
    }

    // Find indices
    const draggedIndex = items.findIndex((item) => item.id === draggedId);
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

    onReorder(updatedOrders);
    setDraggedId(null);
  };

  return (
    <div className={className}>
      {items.map((item) => (
        <div
          key={item.id}
          data-drag-id={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragEnd={handleDragEnd}
          onDragEnter={(e) => handleDragEnter(e, item.id)}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item.id)}
          style={{
            cursor: 'grab',
            opacity: draggedId === item.id ? 0.5 : 1,
            transform: dragOverId === item.id ? 'scale(1.02)' : 'scale(1)',
            transition: 'transform 0.15s ease, opacity 0.15s ease',
            outline: dragOverId === item.id ? '2px dashed var(--color-primary)' : 'none',
            outlineOffset: '2px',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {renderItem(item, draggedId === item.id)}
        </div>
      ))}
    </div>
  );
}
