'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Plus, Trash2 } from 'lucide-react';
import dialogStyles from './dialog.module.css';

const dbTypes = [
  { value: 'sqlite', label: 'SQLite' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' },
  { value: 'turso', label: 'Turso' },
  { value: 'supabase', label: 'Supabase' },
  { value: 'none', label: 'None' },
  { value: 'other', label: 'Other' },
];

interface Volume {
  host: string;
  container: string;
}

interface LinkOption {
  id: string;
  name: string;
  url: string;
}

interface CredentialOption {
  id: string;
  name: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  dbType: string;
  dbTypeOther: string;
  dbPath: string;
  dbConnection: string;
  containers: string[];
  volumes: Volume[];
  domains: string[];
  gitRepo: string;
  techStack: string;
  pendingMigrations: string;
  notes: string;
  linkedLinkIds: string[];
  linkedCredentialIds: string[];
}

interface EditingProject {
  id: string;
  name: string;
  description: string | null;
  dbType: string;
  dbTypeOther: string | null;
  dbPath: string | null;
  dbConnection: string | null;
  containers?: string[];
  volumes?: Volume[];
  domains?: string[];
  gitRepo: string | null;
  techStack: string | null;
  pendingMigrations: string | null;
  notes: string | null;
  linkedLinkIds?: string[];
  linkedCredentialIds?: string[];
}

interface ProjectFormDialogProps {
  isOpen: boolean;
  isEditing: boolean;
  editingProject?: EditingProject | null;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  links?: LinkOption[];
  credentials?: CredentialOption[];
}

const initialFormData: ProjectFormData = {
  name: '',
  description: '',
  dbType: 'none',
  dbTypeOther: '',
  dbPath: '',
  dbConnection: '',
  containers: [],
  volumes: [],
  domains: [],
  gitRepo: '',
  techStack: '',
  pendingMigrations: '',
  notes: '',
  linkedLinkIds: [],
  linkedCredentialIds: [],
};

export function ProjectFormDialog({
  isOpen,
  isEditing,
  editingProject,
  onSubmit,
  onCancel,
  links = [],
  credentials = [],
}: ProjectFormDialogProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [newContainer, setNewContainer] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newVolumeHost, setNewVolumeHost] = useState('');
  const [newVolumeContainer, setNewVolumeContainer] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (isEditing && editingProject) {
      setFormData({
        name: editingProject.name,
        description: editingProject.description || '',
        dbType: editingProject.dbType,
        dbTypeOther: editingProject.dbTypeOther || '',
        dbPath: editingProject.dbPath || '',
        dbConnection: editingProject.dbConnection || '',
        containers: editingProject.containers || [],
        volumes: editingProject.volumes || [],
        domains: editingProject.domains || [],
        gitRepo: editingProject.gitRepo || '',
        techStack: editingProject.techStack || '',
        pendingMigrations: editingProject.pendingMigrations || '',
        notes: editingProject.notes || '',
        linkedLinkIds: editingProject.linkedLinkIds || [],
        linkedCredentialIds: editingProject.linkedCredentialIds || [],
      });
    } else if (!isEditing) {
      setFormData(initialFormData);
    }
  }, [isEditing, editingProject]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData(initialFormData);
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    onCancel();
  };

  const addContainer = () => {
    if (newContainer.trim()) {
      setFormData({
        ...formData,
        containers: [...formData.containers, newContainer.trim()],
      });
      setNewContainer('');
    }
  };

  const removeContainer = (index: number) => {
    setFormData({
      ...formData,
      containers: formData.containers.filter((_, i) => i !== index),
    });
  };

  const addDomain = () => {
    if (newDomain.trim()) {
      setFormData({
        ...formData,
        domains: [...formData.domains, newDomain.trim()],
      });
      setNewDomain('');
    }
  };

  const removeDomain = (index: number) => {
    setFormData({
      ...formData,
      domains: formData.domains.filter((_, i) => i !== index),
    });
  };

  const addVolume = () => {
    if (newVolumeHost.trim() && newVolumeContainer.trim()) {
      setFormData({
        ...formData,
        volumes: [...formData.volumes, { host: newVolumeHost.trim(), container: newVolumeContainer.trim() }],
      });
      setNewVolumeHost('');
      setNewVolumeContainer('');
    }
  };

  const removeVolume = (index: number) => {
    setFormData({
      ...formData,
      volumes: formData.volumes.filter((_, i) => i !== index),
    });
  };

  const toggleLinkSelection = (linkId: string) => {
    if (formData.linkedLinkIds.includes(linkId)) {
      setFormData({
        ...formData,
        linkedLinkIds: formData.linkedLinkIds.filter(id => id !== linkId),
      });
    } else {
      setFormData({
        ...formData,
        linkedLinkIds: [...formData.linkedLinkIds, linkId],
      });
    }
  };

  const toggleCredentialSelection = (credentialId: string) => {
    if (formData.linkedCredentialIds.includes(credentialId)) {
      setFormData({
        ...formData,
        linkedCredentialIds: formData.linkedCredentialIds.filter(id => id !== credentialId),
      });
    } else {
      setFormData({
        ...formData,
        linkedCredentialIds: [...formData.linkedCredentialIds, credentialId],
      });
    }
  };

  return (
    <div className={dialogStyles.overlay}>
      <div className={dialogStyles.dialog} style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className={dialogStyles.dialogHeader}>
          <h3 className={dialogStyles.dialogTitle}>{isEditing ? 'Edit Project' : 'Add New Project'}</h3>
          <button onClick={handleCancel} className={dialogStyles.closeButton}>
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={dialogStyles.form}>
          {/* Basic Info */}
          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Project Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={dialogStyles.input}
              placeholder="e.g., DegixHub"
            />
          </div>

          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={dialogStyles.input}
              rows={2}
              placeholder="Brief project description..."
            />
          </div>

          {/* Database Section */}
          <div style={{ background: 'var(--color-muted)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Database</h4>

            <div className={dialogStyles.formField}>
              <label className={dialogStyles.label}>Database Type</label>
              <select
                value={formData.dbType}
                onChange={(e) => setFormData({ ...formData, dbType: e.target.value })}
                className={dialogStyles.input}
              >
                {dbTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.dbType === 'other' && (
              <div className={dialogStyles.formField}>
                <label className={dialogStyles.label}>Custom DB Type</label>
                <input
                  type="text"
                  value={formData.dbTypeOther}
                  onChange={(e) => setFormData({ ...formData, dbTypeOther: e.target.value })}
                  className={dialogStyles.input}
                  placeholder="e.g., CockroachDB"
                />
              </div>
            )}

            <div className={dialogStyles.formField}>
              <label className={dialogStyles.label}>Database Path (Host)</label>
              <input
                type="text"
                value={formData.dbPath}
                onChange={(e) => setFormData({ ...formData, dbPath: e.target.value })}
                className={dialogStyles.input}
                placeholder="e.g., /mnt/storage/project/data/production.db"
              />
            </div>

            <div className={dialogStyles.formField}>
              <label className={dialogStyles.label}>Connection String (Encrypted)</label>
              <input
                type="password"
                value={formData.dbConnection}
                onChange={(e) => setFormData({ ...formData, dbConnection: e.target.value })}
                className={dialogStyles.input}
                placeholder="e.g., postgresql://user:pass@host:5432/db"
              />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginTop: '4px' }}>
                Stored encrypted. Requires PIN to view.
              </p>
            </div>
          </div>

          {/* Infrastructure Section */}
          <div style={{ background: 'var(--color-muted)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
            <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Infrastructure</h4>

            {/* Containers */}
            <div className={dialogStyles.formField}>
              <label className={dialogStyles.label}>Containers</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input
                  type="text"
                  value={newContainer}
                  onChange={(e) => setNewContainer(e.target.value)}
                  className={dialogStyles.input}
                  placeholder="Container name"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addContainer())}
                />
                <Button type="button" variant="outline" onClick={addContainer}>
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                </Button>
              </div>
              {formData.containers.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                  {formData.containers.map((container, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      background: 'var(--color-background)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-sm)'
                    }}>
                      <code>{container}</code>
                      <button type="button" onClick={() => removeContainer(idx)} style={{ color: 'var(--color-destructive)' }}>
                        <Trash2 style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Domains */}
            <div className={dialogStyles.formField}>
              <label className={dialogStyles.label}>Domains</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className={dialogStyles.input}
                  placeholder="e.g., hub.example.com"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                />
                <Button type="button" variant="outline" onClick={addDomain}>
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                </Button>
              </div>
              {formData.domains.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                  {formData.domains.map((domain, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      background: 'var(--color-background)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-sm)'
                    }}>
                      {domain}
                      <button type="button" onClick={() => removeDomain(idx)} style={{ color: 'var(--color-destructive)' }}>
                        <Trash2 style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Volumes */}
            <div className={dialogStyles.formField}>
              <label className={dialogStyles.label}>Volumes</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input
                  type="text"
                  value={newVolumeHost}
                  onChange={(e) => setNewVolumeHost(e.target.value)}
                  className={dialogStyles.input}
                  placeholder="Host path"
                  style={{ flex: 1 }}
                />
                <span style={{ alignSelf: 'center' }}>:</span>
                <input
                  type="text"
                  value={newVolumeContainer}
                  onChange={(e) => setNewVolumeContainer(e.target.value)}
                  className={dialogStyles.input}
                  placeholder="Container path"
                  style={{ flex: 1 }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addVolume())}
                />
                <Button type="button" variant="outline" onClick={addVolume}>
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                </Button>
              </div>
              {formData.volumes.length > 0 && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  {formData.volumes.map((volume, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      background: 'var(--color-background)',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-sm)',
                      marginBottom: 'var(--space-1)'
                    }}>
                      <code>{volume.host}</code>
                      <span>:</span>
                      <code>{volume.container}</code>
                      <button type="button" onClick={() => removeVolume(idx)} style={{ color: 'var(--color-destructive)', marginLeft: 'auto' }}>
                        <Trash2 style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Project Info */}
          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Git Repository</label>
            <input
              type="url"
              value={formData.gitRepo}
              onChange={(e) => setFormData({ ...formData, gitRepo: e.target.value })}
              className={dialogStyles.input}
              placeholder="https://github.com/user/repo"
            />
          </div>

          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Tech Stack</label>
            <input
              type="text"
              value={formData.techStack}
              onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
              className={dialogStyles.input}
              placeholder="e.g., Bun, Hono, Next.js, SQLite"
            />
          </div>

          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Pending Migrations / Commands</label>
            <textarea
              value={formData.pendingMigrations}
              onChange={(e) => setFormData({ ...formData, pendingMigrations: e.target.value })}
              className={dialogStyles.input}
              rows={3}
              placeholder="SQL commands or notes about pending migrations..."
            />
          </div>

          <div className={dialogStyles.formField}>
            <label className={dialogStyles.label}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={dialogStyles.input}
              rows={3}
              placeholder="Any additional notes..."
            />
          </div>

          {/* Linked Items */}
          {(links.length > 0 || credentials.length > 0) && (
            <div style={{ background: 'var(--color-muted)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Link Resources</h4>

              {links.length > 0 && (
                <div className={dialogStyles.formField}>
                  <label className={dialogStyles.label}>Links</label>
                  <div style={{ maxHeight: '100px', overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2)' }}>
                    {links.map((link) => (
                      <label key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', padding: '4px 0' }}>
                        <input
                          type="checkbox"
                          checked={formData.linkedLinkIds.includes(link.id)}
                          onChange={() => toggleLinkSelection(link.id)}
                        />
                        <span style={{ fontSize: 'var(--text-sm)' }}>{link.name}</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)' }}>
                          ({new URL(link.url).hostname})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {credentials.length > 0 && (
                <div className={dialogStyles.formField}>
                  <label className={dialogStyles.label}>Credentials</label>
                  <div style={{ maxHeight: '100px', overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2)' }}>
                    {credentials.map((cred) => (
                      <label key={cred.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', padding: '4px 0' }}>
                        <input
                          type="checkbox"
                          checked={formData.linkedCredentialIds.includes(cred.id)}
                          onChange={() => toggleCredentialSelection(cred.id)}
                        />
                        <span style={{ fontSize: 'var(--text-sm)' }}>{cred.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={dialogStyles.formActions}>
            <Button type="submit" style={{ flex: 1 }}>{isEditing ? 'Update' : 'Add'} Project</Button>
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
