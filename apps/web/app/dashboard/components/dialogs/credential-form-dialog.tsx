'use client';

import { Button } from '@/components/ui/button';
import { X, RefreshCw, Copy, Link } from 'lucide-react';
import { toast } from 'sonner';
import { CategorySelect } from '../ui/category-select';
import { copySecureToClipboard } from '@/lib/clipboard';
import dialogStyles from './dialog.module.css';

interface CredentialFormData {
  name: string;
  data: string;
  category: string;
  linkedLinkId: string | null;
}

interface LinkOption {
  id: string;
  name: string;
  url: string;
}

interface CredentialFormDialogProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: CredentialFormData;
  onFormDataChange: (data: CredentialFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  categories: string[];
  onAddCategory: (name: string, color?: string) => void;
  links?: LinkOption[];
}

// Password generator
const generatePassword = (length = 16) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export function CredentialFormDialog({
  isOpen,
  isEditing,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  categories,
  onAddCategory,
  links = [],
}: CredentialFormDialogProps) {
  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(20);
    onFormDataChange({ ...formData, data: newPassword });
    toast.success('Password generated!');
  };

  const handleCopy = async (text: string) => {
    await copySecureToClipboard(text);
    toast.success('Copied! (clears in 30s)');
  };

  return (
    <div className={dialogStyles.overlay}>
      <div className={dialogStyles.dialog}>
        <div className={dialogStyles.dialogHeader}>
          <h3 className={dialogStyles.dialogTitle}>{isEditing ? 'Edit Credential' : 'Add New Credential'}</h3>
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
            <label className={dialogStyles.label}>Password/Secret *</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="text"
                required
                value={formData.data}
                onChange={(e) => onFormDataChange({ ...formData, data: e.target.value })}
                className={dialogStyles.input}
                placeholder={isEditing ? 'Enter new password or leave current' : ''}
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGeneratePassword}
                title="Generate secure password"
                style={{ flexShrink: 0 }}
              >
                <RefreshCw style={{ width: '1rem', height: '1rem' }} />
              </Button>
              {formData.data && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopy(formData.data)}
                  title="Copy password"
                  style={{ flexShrink: 0 }}
                >
                  <Copy style={{ width: '1rem', height: '1rem' }} />
                </Button>
              )}
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginTop: '4px' }}>
              Click <RefreshCw style={{ width: '0.75rem', height: '0.75rem', display: 'inline' }} /> to generate a secure 20-character password
            </p>
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
          {links.length > 0 && (
            <div className={dialogStyles.formField}>
              <label className={dialogStyles.label}>
                <Link style={{ width: '0.875rem', height: '0.875rem', display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Link verknüpfen
              </label>
              <select
                value={formData.linkedLinkId || ''}
                onChange={(e) => onFormDataChange({ ...formData, linkedLinkId: e.target.value || null })}
                className={dialogStyles.input}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Kein Link</option>
                {links.map((link) => (
                  <option key={link.id} value={link.id}>
                    {link.name} ({new URL(link.url).hostname})
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginTop: '4px' }}>
                Verknüpfe dieses Credential mit einem Link
              </p>
            </div>
          )}
          <div className={dialogStyles.formActions}>
            <Button type="submit" style={{ flex: 1 }}>{isEditing ? 'Update' : 'Add'} Credential</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
