'use client';

import { Button } from '@/components/ui/button';
import { Grid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <Button
        size="sm"
        variant={viewMode === 'grid' ? 'primary' : 'ghost'}
        onClick={() => onViewModeChange('grid')}
        style={{ borderRadius: 0, padding: '0.5rem' }}
        title="Grid View"
      >
        <Grid style={{ width: '1rem', height: '1rem' }} />
      </Button>
      <Button
        size="sm"
        variant={viewMode === 'table' ? 'primary' : 'ghost'}
        onClick={() => onViewModeChange('table')}
        style={{ borderRadius: 0, padding: '0.5rem' }}
        title="Table View"
      >
        <List style={{ width: '1rem', height: '1rem' }} />
      </Button>
    </div>
  );
}
