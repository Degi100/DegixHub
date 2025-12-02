'use client';

import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { CategorySelect } from '../ui/category-select';
import dialogStyles from './dialog.module.css';

interface LinkFormData {
  name: string;
  url: string;
  category: string;
  description: string;
  favicon: string;
  linkedCredentialId: string;
}

interface CredentialOption {
  id: string;
  name: string;
}

interface LinkFormDialogProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: LinkFormData;
  onFormDataChange: (data: LinkFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onUrlChange: (url: string) => void;
  isFetchingMeta: boolean;
  categories: string[];
  onAddCategory: (name: string, color?: string) => void;
  credentials: CredentialOption[];
}

export function LinkFormDialog({
  isOpen,
  isEditing,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  onUrlChange,
  isFetchingMeta,
  categories,
  onAddCategory,
  credentials,
}: LinkFormDialogProps) {
  if (!isOpen) return null;

  return (
    <div className={dialogStyles.overlay}>
      <div className={dialogStyles.dialog}>
        <div className={dialogStyles.dialogHeader}>
          <h3 className={dialogStyles.dialogTitle}>{isEditing ? 'Edit Link' : 'Add New Link'}</h3>
          <button onClick={onCancel} className={dialogStyles.closeButton}>
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
        <form onSubmit={onSubmit} className={dialogStyles.form}>
          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              className={dialogStyles.input}
            />
          </div>
          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>URL *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => onUrlChange(e.target.value)}
                className={dialogStyles.input}
                placeholder="https://example.com"
              />
              {isFetchingMeta && (
                <Loader2 style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  animation: 'spin 1s linear infinite',
                  color: 'var(--color-muted-foreground)'
                }} />
              )}
            </div>
            {!isEditing && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginTop: '4px' }}>
                Name & Description werden automatisch gefetcht
              </p>
            )}
          </div>
          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Category</label>
            <CategorySelect
              value={formData.category}
              onChange={(value) => onFormDataChange({ ...formData, category: value })}
              categories={categories}
              onAddCategory={onAddCategory}
            />
          </div>
          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              rows={3}
              className={`${dialogStyles.input} ${dialogStyles.textarea}`}
            />
          </div>
          {credentials.length > 0 && (
            <div className={dialogStyles.formField}>
              <label className={dialogStyles.label}>Linked Credential</label>
              <select
                value={formData.linkedCredentialId}
                onChange={(e) => onFormDataChange({ ...formData, linkedCredentialId: e.target.value })}
                className={dialogStyles.input}
              >
                <option value="">-- No Credential --</option>
                {credentials.map((cred) => (
                  <option key={cred.id} value={cred.id}>{cred.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className={dialogStyles.formActions}>
            <Button type="submit" style={{ flex: 1 }}>{isEditing ? 'Update' : 'Add'} Link</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
