'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, FolderKanban, Database, Globe, Server, GitBranch, Copy, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc/react';
import { PinModal } from '../components/pin';
import { copySecureToClipboard } from '@/lib/clipboard';
import { usePinProtection } from '../hooks';
import dialogStyles from '../components/dialogs/dialog.module.css';
import { ProjectFormDialog } from '../components/dialogs/project-form-dialog';
import { ViewProjectModal } from '../components/dialogs/view-project-modal';

// DB type display names
const dbTypeLabels: Record<string, string> = {
  sqlite: 'SQLite',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  mariadb: 'MariaDB',
  mongodb: 'MongoDB',
  redis: 'Redis',
  turso: 'Turso',
  supabase: 'Supabase',
  none: 'None',
  other: 'Other',
};

interface Volume {
  host: string;
  container: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  dbType: string;
  dbTypeOther: string | null;
  dbPath: string | null;
  hasDbConnection?: boolean;
  containers?: string[];
  volumes?: Volume[];
  domains?: string[];
  gitRepo: string | null;
  techStack: string | null;
  pendingMigrations: string | null;
  notes: string | null;
  linkedLinkIds?: string[];
  linkedCredentialIds?: string[];
  linkedLinks?: Array<{ id: string; name: string; url: string }>;
  linkedCredentials?: Array<{ id: string; name: string }>;
  createdAt: Date | string;
  updatedAt: Date | string;
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

interface ProjectsSectionProps {
  projects: Project[] | undefined;
  links?: LinkOption[];
  credentials?: CredentialOption[];
  onDeleteProject: (id: string) => void;
  onCreateProject: (data: any) => void;
  onUpdateProject: (data: any) => void;
}

export function ProjectsSection({
  projects,
  links = [],
  credentials = [],
  onDeleteProject,
  onCreateProject,
  onUpdateProject,
}: ProjectsSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  // PIN protection
  const executeAction = (action: { type: 'view' | 'edit'; id: string }) => {
    if (action.type === 'view') {
      setViewingId(action.id);
    } else if (action.type === 'edit') {
      setEditingId(action.id);
    }
  };

  const {
    showPinModal,
    pinModalMode,
    handleProtectedAction: pinProtectedAction,
    handlePinSuccess,
    handlePinClose,
  } = usePinProtection({ onExecute: executeAction });

  // Fetch project data when viewing (with decrypted dbConnection)
  const { data: viewedProject } = trpc.projects.getById.useQuery(
    { id: viewingId! },
    { enabled: !!viewingId }
  );

  const { data: editingProject } = trpc.projects.getById.useQuery(
    { id: editingId! },
    { enabled: !!editingId }
  );

  const handleProtectedAction = (type: 'view' | 'edit', id: string) => {
    // Check if project has sensitive data that needs PIN protection
    const project = projects?.find(p => p.id === id);
    if (project?.hasDbConnection) {
      pinProtectedAction({ type, id });
    } else {
      // No sensitive data, open directly
      executeAction({ type, id });
    }
  };

  const handleCopyCommand = async (command: string, label: string) => {
    await copySecureToClipboard(command);
    toast.success(`${label} copied!`);
  };

  const getDbTypeLabel = (project: Project) => {
    if (project.dbType === 'other' && project.dbTypeOther) {
      return project.dbTypeOther;
    }
    return dbTypeLabels[project.dbType] || project.dbType;
  };

  // Generate quick commands for a project
  const generateCommands = (project: Project) => {
    const commands: Array<{ label: string; command: string }> = [];
    const containers = project.containers || [];

    // Docker exec commands for each container
    containers.forEach(container => {
      commands.push({
        label: `Exec ${container}`,
        command: `docker exec -it ${container} /bin/sh`,
      });

      // If it's a SQLite DB and we have a path, add sqlite command
      if (project.dbType === 'sqlite' && project.dbPath) {
        commands.push({
          label: `SQLite (${container})`,
          command: `docker exec -it ${container} sqlite3 ${project.dbPath.replace('/mnt/storage/', '/data/')}`,
        });
      }
    });

    // DB path copy
    if (project.dbPath) {
      commands.push({
        label: 'DB Path',
        command: project.dbPath,
      });
    }

    return commands;
  };

  const handleSubmit = (data: any) => {
    if (editingId) {
      onUpdateProject({ id: editingId, ...data });
      setEditingId(null);
    } else {
      onCreateProject(data);
    }
    setShowDialog(false);
  };

  const handleCancel = () => {
    setShowDialog(false);
    setEditingId(null);
  };

  // Populate form when editing
  if (editingProject && editingId && !showDialog) {
    setShowDialog(true);
  }

  return (
    <div className={dialogStyles.section}>
      <div className={dialogStyles.sectionHeader}>
        <h2 className={dialogStyles.sectionTitle}>Projects</h2>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
          Add Project
        </Button>
      </div>

      {/* Project Cards */}
      {projects && projects.length > 0 ? (
        <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <FolderKanban style={{ width: '20px', height: '20px', color: 'var(--color-primary)' }} />
                  <h3 style={{ fontWeight: 600, fontSize: 'var(--text-lg)' }}>{project.name}</h3>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <Button variant="ghost" size="icon" onClick={() => handleProtectedAction('view', project.id)} title="View Details">
                    <Eye style={{ width: '14px', height: '14px' }} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleProtectedAction('edit', project.id)} title="Edit">
                    <Edit style={{ width: '14px', height: '14px' }} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this project?')) onDeleteProject(project.id); }} title="Delete">
                    <Trash2 style={{ width: '14px', height: '14px', color: 'var(--color-destructive)' }} />
                  </Button>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-3)' }}>
                  {project.description}
                </p>
              )}

              {/* Info Grid */}
              <div style={{ display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                {/* Database */}
                {project.dbType !== 'none' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Database style={{ width: '14px', height: '14px', color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-muted-foreground)' }}>DB:</span>
                    <span style={{ fontWeight: 500 }}>{getDbTypeLabel(project)}</span>
                    {project.hasDbConnection && (
                      <span style={{ fontSize: 'var(--text-xs)', padding: '1px 6px', background: 'var(--color-warning)', color: 'black', borderRadius: 'var(--radius-full)' }}>
                        Encrypted
                      </span>
                    )}
                  </div>
                )}

                {/* DB Path */}
                {project.dbPath && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-muted-foreground)', marginLeft: '22px' }}>Path:</span>
                    <code style={{
                      fontSize: 'var(--text-xs)',
                      background: 'var(--color-muted)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {project.dbPath}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => handleCopyCommand(project.dbPath!, 'DB Path')} title="Copy path" style={{ width: '20px', height: '20px' }}>
                      <Copy style={{ width: '12px', height: '12px' }} />
                    </Button>
                  </div>
                )}

                {/* Containers */}
                {(project.containers?.length || 0) > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Server style={{ width: '14px', height: '14px', color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Containers:</span>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                      {project.containers?.map((container, idx) => (
                        <code key={idx} style={{
                          fontSize: 'var(--text-xs)',
                          background: 'var(--color-muted)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {container}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {/* Domains */}
                {(project.domains?.length || 0) > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Globe style={{ width: '14px', height: '14px', color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Domains:</span>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                      {project.domains?.map((domain, idx) => (
                        <a
                          key={idx}
                          href={`https://${domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 'var(--text-xs)',
                            background: 'var(--color-primary)',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          {domain}
                          <ExternalLink style={{ width: '10px', height: '10px' }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Git Repo */}
                {project.gitRepo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <GitBranch style={{ width: '14px', height: '14px', color: 'var(--color-muted-foreground)' }} />
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Git:</span>
                    <a href={project.gitRepo} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-primary)',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {project.gitRepo.replace('https://github.com/', '')}
                    </a>
                  </div>
                )}

                {/* Tech Stack */}
                {project.techStack && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Stack:</span>
                    <span style={{ fontSize: 'var(--text-xs)' }}>{project.techStack}</span>
                  </div>
                )}

                {/* Linked Items */}
                {((project.linkedLinks?.length || 0) > 0 || (project.linkedCredentials?.length || 0) > 0) && (
                  <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)' }}>
                    {(project.linkedLinks?.length || 0) > 0 && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)' }}>
                        {project.linkedLinks?.length} linked link(s)
                      </div>
                    )}
                    {(project.linkedCredentials?.length || 0) > 0 && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)' }}>
                        {project.linkedCredentials?.length} linked credential(s)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Commands */}
              {((project.containers?.length || 0) > 0 || project.dbPath) && (
                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-2)' }}>
                    Quick Commands
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                    {generateCommands(project).slice(0, 3).map((cmd, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCommand(cmd.command, cmd.label)}
                        style={{ fontSize: 'var(--text-xs)', padding: '4px 8px', height: 'auto' }}
                      >
                        <Copy style={{ width: '10px', height: '10px', marginRight: '4px' }} />
                        {cmd.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className={dialogStyles.emptyState}>
          <div className={dialogStyles.emptyIcon}>
            <FolderKanban style={{ width: '1.5rem', height: '1.5rem', color: 'var(--color-muted-foreground)' }} />
          </div>
          <h3 className={dialogStyles.emptyTitle}>No projects yet</h3>
          <p className={dialogStyles.emptyDescription}>
            Track your DevOps projects, databases, and infrastructure here.
          </p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
            Add Project
          </Button>
        </div>
      )}

      {/* Project Form Dialog */}
      <ProjectFormDialog
        isOpen={showDialog}
        isEditing={!!editingId}
        editingProject={editingProject}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        links={links}
        credentials={credentials}
      />

      {/* View Project Modal */}
      <ViewProjectModal
        project={viewingId && viewedProject ? viewedProject : null}
        onClose={() => setViewingId(null)}
      />

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        mode={pinModalMode}
      />
    </div>
  );
}
