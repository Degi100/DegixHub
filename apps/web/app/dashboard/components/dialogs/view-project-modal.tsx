'use client';

import { Button } from '@/components/ui/button';
import { X, Copy, Database, Server, Globe, GitBranch, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { copySecureToClipboard } from '@/lib/clipboard';
import dialogStyles from './dialog.module.css';

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
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ViewProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ViewProjectModal({ project, onClose }: ViewProjectModalProps) {
  if (!project) return null;

  const handleCopy = async (text: string, label: string) => {
    await copySecureToClipboard(text);
    toast.success(`${label} copied! (clears in 30s)`);
  };

  const getDbTypeLabel = () => {
    if (project.dbType === 'other' && project.dbTypeOther) {
      return project.dbTypeOther;
    }
    return dbTypeLabels[project.dbType] || project.dbType;
  };

  // Generate quick commands
  const generateCommands = () => {
    const commands: Array<{ label: string; command: string }> = [];
    const containers = project.containers || [];

    containers.forEach(container => {
      commands.push({
        label: `Exec into ${container}`,
        command: `docker exec -it ${container} /bin/sh`,
      });

      if (project.dbType === 'sqlite' && project.dbPath) {
        const containerPath = project.dbPath.replace('/mnt/storage/', '/data/');
        commands.push({
          label: `SQLite in ${container}`,
          command: `docker exec -it ${container} sqlite3 ${containerPath}`,
        });
      }
    });

    if (project.dbPath) {
      commands.push({
        label: 'Copy DB Path',
        command: project.dbPath,
      });
    }

    if (project.dbConnection) {
      commands.push({
        label: 'Copy Connection String',
        command: project.dbConnection,
      });
    }

    return commands;
  };

  const commands = generateCommands();

  return (
    <div className={dialogStyles.overlay}>
      <div className={dialogStyles.dialog} style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className={dialogStyles.dialogHeader}>
          <h3 className={dialogStyles.dialogTitle}>{project.name}</h3>
          <button onClick={onClose} className={dialogStyles.closeButton}>
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-4)' }}>
          {/* Description */}
          {project.description && (
            <p style={{ color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-4)' }}>
              {project.description}
            </p>
          )}

          {/* Quick Commands */}
          {commands.length > 0 && (
            <div style={{ marginBottom: 'var(--space-4)', background: 'var(--color-muted)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Quick Commands</h4>
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {commands.map((cmd, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--color-background)',
                    padding: 'var(--space-2)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted-foreground)' }}>{cmd.label}</div>
                      <code style={{ fontSize: 'var(--text-sm)', wordBreak: 'break-all' }}>{cmd.command}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(cmd.command, cmd.label)}
                    >
                      <Copy style={{ width: '14px', height: '14px' }} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Database Info */}
          {project.dbType !== 'none' && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Database style={{ width: '16px', height: '16px' }} />
                Database
              </h4>
              <div style={{ display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ color: 'var(--color-muted-foreground)', width: '100px' }}>Type:</span>
                  <span style={{ fontWeight: 500 }}>{getDbTypeLabel()}</span>
                </div>
                {project.dbPath && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-muted-foreground)', width: '100px' }}>Path:</span>
                    <code style={{
                      background: 'var(--color-muted)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      flex: 1,
                      wordBreak: 'break-all'
                    }}>
                      {project.dbPath}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(project.dbPath!, 'DB Path')}>
                      <Copy style={{ width: '14px', height: '14px' }} />
                    </Button>
                  </div>
                )}
                {project.dbConnection && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-muted-foreground)', width: '100px' }}>Connection:</span>
                    <code style={{
                      background: 'var(--color-warning)',
                      color: 'black',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      flex: 1,
                      wordBreak: 'break-all'
                    }}>
                      {project.dbConnection}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(project.dbConnection!, 'Connection String')}>
                      <Copy style={{ width: '14px', height: '14px' }} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Infrastructure */}
          {((project.containers?.length || 0) > 0 || (project.volumes?.length || 0) > 0) && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Server style={{ width: '16px', height: '16px' }} />
                Infrastructure
              </h4>
              <div style={{ display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                {(project.containers?.length || 0) > 0 && (
                  <div>
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Containers:</span>
                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
                      {project.containers?.map((container, idx) => (
                        <code key={idx} style={{
                          background: 'var(--color-muted)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {container}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
                {(project.volumes?.length || 0) > 0 && (
                  <div>
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Volumes:</span>
                    <div style={{ marginTop: 'var(--space-1)' }}>
                      {project.volumes?.map((volume, idx) => (
                        <div key={idx} style={{
                          background: 'var(--color-muted)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: 'var(--space-1)',
                          fontSize: 'var(--text-xs)'
                        }}>
                          <code>{volume.host}</code> : <code>{volume.container}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Domains */}
          {(project.domains?.length || 0) > 0 && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Globe style={{ width: '16px', height: '16px' }} />
                Domains
              </h4>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {project.domains?.map((domain, idx) => (
                  <a
                    key={idx}
                    href={`https://${domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      background: 'var(--color-primary)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      fontSize: 'var(--text-sm)'
                    }}
                  >
                    {domain}
                    <ExternalLink style={{ width: '12px', height: '12px' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Git & Tech Stack */}
          {(project.gitRepo || project.techStack) && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <GitBranch style={{ width: '16px', height: '16px' }} />
                Project Info
              </h4>
              <div style={{ display: 'grid', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                {project.gitRepo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Repository:</span>
                    <a href={project.gitRepo} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
                      {project.gitRepo.replace('https://github.com/', '')}
                      <ExternalLink style={{ width: '12px', height: '12px', marginLeft: '4px', display: 'inline' }} />
                    </a>
                  </div>
                )}
                {project.techStack && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ color: 'var(--color-muted-foreground)' }}>Tech Stack:</span>
                    <span>{project.techStack}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pending Migrations */}
          {project.pendingMigrations && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FileText style={{ width: '16px', height: '16px' }} />
                Pending Migrations
              </h4>
              <div style={{
                background: 'var(--color-warning)',
                color: 'black',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                position: 'relative'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 'var(--text-sm)' }}>{project.pendingMigrations}</pre>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(project.pendingMigrations!, 'Migrations')}
                  style={{ position: 'absolute', top: '8px', right: '8px' }}
                >
                  <Copy style={{ width: '14px', height: '14px' }} />
                </Button>
              </div>
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Notes</h4>
              <div style={{
                background: 'var(--color-muted)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                whiteSpace: 'pre-wrap'
              }}>
                {project.notes}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <Button onClick={onClose} style={{ width: '100%' }}>Close</Button>
        </div>
      </div>
    </div>
  );
}
