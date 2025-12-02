'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { CategorySelect } from './category-select';
import dialogStyles from './dialog.module.css';

interface NoteFormData {
  title: string;
  content: string;
  category: string;
  linkedLinkId: string;
  linkedCredentialId: string;
}

interface LinkedLink {
  id: string;
  name: string;
  url: string;
}

interface LinkedCredential {
  id: string;
  name: string;
}

interface NoteFormDialogProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: NoteFormData;
  onFormDataChange: (data: NoteFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  categories: string[];
  onAddCategory: (name: string, color?: string) => void;
  links: LinkedLink[];
  credentials: LinkedCredential[];
}

export function NoteFormDialog({
  isOpen,
  isEditing,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  categories,
  onAddCategory,
  links,
  credentials,
}: NoteFormDialogProps) {
  if (!isOpen) return null;

  return (
    <div className={dialogStyles.overlay}>
      <div className={dialogStyles.dialog}>
        <div className={dialogStyles.dialogHeader}>
          <h3 className={dialogStyles.dialogTitle}>{isEditing ? 'Edit Note' : 'Add New Note'}</h3>
          <button onClick={onCancel} className={dialogStyles.closeButton}>
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
        <form onSubmit={onSubmit} className={dialogStyles.form}>
          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
              className={dialogStyles.input}
              placeholder="Note title"
            />
          </div>
          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Content *</label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => onFormDataChange({ ...formData, content: e.target.value })}
              rows={8}
              className={`${dialogStyles.input} ${dialogStyles.textarea}`}
              placeholder="Note content (Markdown supported)"
            />
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
            <label className={dialogStyles.label}>Link to Link (optional)</label>
            <select
              value={formData.linkedLinkId}
              onChange={(e) => onFormDataChange({ ...formData, linkedLinkId: e.target.value })}
              className={dialogStyles.input}
            >
              <option value="">-- None --</option>
              {links.map((link) => (
                <option key={link.id} value={link.id}>
                  {link.name} ({link.url})
                </option>
              ))}
            </select>
          </div>
          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Link to Credential (optional)</label>
            <select
              value={formData.linkedCredentialId}
              onChange={(e) => onFormDataChange({ ...formData, linkedCredentialId: e.target.value })}
              className={dialogStyles.input}
            >
              <option value="">-- None --</option>
              {credentials.map((cred) => (
                <option key={cred.id} value={cred.id}>
                  {cred.name}
                </option>
              ))}
            </select>
          </div>
          <div className={dialogStyles.formActions}>
            <Button type="submit" style={{ flex: 1 }}>{isEditing ? 'Update' : 'Add'} Note</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
