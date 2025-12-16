'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Lock, Unlock, Tag, Plus, Trash2, X } from 'lucide-react';
import { trpc } from '@/lib/trpc/react';
import { toast } from 'sonner';
import { PinModal, usePinContext } from '../components/pin';
import dialogStyles from '../components/dialogs/dialog.module.css';

// Default categories that cannot be deleted
const DEFAULT_CATEGORY_NAMES = [
  'General', 'Work', 'Personal', 'Development', 'Design', 'Documentation',
  'Social', 'Entertainment', 'Shopping', 'News', 'Ideas', 'Projects', 'Todo'
];

interface SettingsSectionProps {
  onCategoriesChange?: () => void;
}

export function SettingsSection({ onCategoriesChange }: SettingsSectionProps) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'change' | 'recovery'>('setup');
  const { hasPin, unlock, refetchHasPin } = usePinContext();

  // Category state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6b7280');
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; color: string } | null>(null);

  // Category queries and mutations
  const utils = trpc.useUtils();
  const { data: categoriesData } = trpc.categories.getAll.useQuery();
  const createCategoryMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.getAll.invalidate();
      setNewCategoryName('');
      setNewCategoryColor('#6b7280');
      toast.success('Kategorie erstellt');
      onCategoriesChange?.();
    },
  });
  const updateCategoryMutation = trpc.categories.update.useMutation({
    onSuccess: () => {
      utils.categories.getAll.invalidate();
      setEditingCategory(null);
      toast.success('Kategorie aktualisiert');
      onCategoriesChange?.();
    },
  });
  const deleteCategoryMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.getAll.invalidate();
      toast.success('Kategorie gelöscht');
      onCategoriesChange?.();
    },
  });
  const updateDefaultColorMutation = trpc.categories.updateDefaultColor.useMutation({
    onSuccess: () => {
      utils.categories.getAll.invalidate();
      toast.success('Farbe aktualisiert');
      onCategoriesChange?.();
    },
  });

  // Check if color is already used
  const isColorUsed = (color: string, excludeName?: string) => {
    if (!categoriesData?.colorMap) return false;
    const normalizedColor = color.toLowerCase();
    return Object.entries(categoriesData.colorMap).some(
      ([name, c]) => c.toLowerCase() === normalizedColor && name !== excludeName
    );
  };

  // Handle color change with duplicate check
  const handleColorChange = (
    color: string,
    categoryName: string,
    updateFn: () => void
  ) => {
    if (isColorUsed(color, categoryName)) {
      toast.error('Diese Farbe wird bereits verwendet!');
      return;
    }
    updateFn();
  };

  // Listen for recovery event from PIN modal
  useEffect(() => {
    const handleOpenRecovery = () => {
      setPinModalMode('recovery');
      setShowPinModal(true);
    };

    window.addEventListener('open-pin-recovery', handleOpenRecovery);
    return () => window.removeEventListener('open-pin-recovery', handleOpenRecovery);
  }, []);


  return (
    <div className={dialogStyles.section}>
      <div className={dialogStyles.sectionHeader}>
        <h2 className={dialogStyles.sectionTitle}>
          <Settings style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem', display: 'inline' }} />
          Einstellungen
        </h2>
      </div>

      {/* Security Settings */}
      <div style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-card)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h3 style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}>
          <Shield style={{ width: '1.25rem', height: '1.25rem' }} />
          Sicherheit
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)'
        }}>
          {/* PIN Status */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-4)',
            backgroundColor: 'rgba(var(--category-general), 0.05)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}>
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Security PIN</h4>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted-foreground)' }}>
                {hasPin
                  ? 'PIN ist gesetzt. Credentials sind geschützt.'
                  : 'Kein PIN gesetzt. Credentials sind ungeschützt.'
                }
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {hasPin ? (
                <Lock style={{ width: '1.25rem', height: '1.25rem', color: '#22c55e' }} />
              ) : (
                <Unlock style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444' }} />
              )}
            </div>
          </div>

          {/* PIN Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {!hasPin ? (
              <Button onClick={() => {
                setPinModalMode('setup');
                setShowPinModal(true);
              }}>
                <Lock style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
                PIN festlegen
              </Button>
            ) : (
              <Button onClick={() => {
                setPinModalMode('change');
                setShowPinModal(true);
              }}>
                <Lock style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }} />
                PIN ändern
              </Button>
            )}
          </div>

          {/* PIN Info */}
          <div style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-muted-foreground)',
            padding: 'var(--space-3)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <p style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Hinweis:</strong> Der PIN schützt den Zugriff auf Credentials.
            </p>
            <ul style={{ paddingLeft: 'var(--space-4)', margin: 0 }}>
              <li>4-stelliger PIN</li>
              <li>Wird bei Credential-Zugriff abgefragt</li>
              <li>5 Minuten Timeout oder Session-Option</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Category Management */}
      <div style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-card)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-sm)',
        marginTop: 'var(--space-6)'
      }}>
        <h3 style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}>
          <Tag style={{ width: '1.25rem', height: '1.25rem' }} />
          Kategorien
        </h3>

        {/* Add new category */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Neue Kategorie..."
            style={{
              flex: 1,
              minWidth: '150px',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-background)',
              fontSize: 'var(--text-sm)',
            }}
          />
          <input
            type="color"
            value={newCategoryColor}
            onChange={(e) => setNewCategoryColor(e.target.value)}
            style={{
              width: '40px',
              height: '36px',
              padding: '2px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
            }}
          />
          <Button
            onClick={() => {
              if (newCategoryName.trim()) {
                if (isColorUsed(newCategoryColor)) {
                  toast.error('Diese Farbe wird bereits verwendet!');
                  return;
                }
                createCategoryMutation.mutate({
                  name: newCategoryName.trim(),
                  color: newCategoryColor,
                });
              }
            }}
            disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
          >
            <Plus style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-1)' }} />
            Hinzufügen
          </Button>
        </div>

        {/* Category list */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {/* Custom categories (editable) */}
          {categoriesData?.customCategories?.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: editingCategory?.id === cat.id ? 'var(--color-muted)' : 'transparent',
              }}
            >
              {editingCategory?.id === cat.id ? (
                <>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="color"
                      value={editingCategory.color}
                      onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                      style={{
                        position: 'absolute',
                        width: '32px',
                        height: '32px',
                        opacity: 0,
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      style={{
                        display: 'block',
                        width: '24px',
                        height: '24px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: editingCategory.color,
                        border: '2px solid var(--color-border)',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    style={{
                      flex: 1,
                      padding: 'var(--space-1) var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (editingCategory.color !== cat.color && isColorUsed(editingCategory.color, cat.name)) {
                        toast.error('Diese Farbe wird bereits verwendet!');
                        return;
                      }
                      updateCategoryMutation.mutate({
                        id: cat.id,
                        name: editingCategory.name !== cat.name ? editingCategory.name : undefined,
                        color: editingCategory.color !== cat.color ? editingCategory.color : undefined,
                      });
                    }}
                    disabled={editingCategory.name === cat.name && editingCategory.color === cat.color}
                  >
                    Speichern
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCategory(null)}
                  >
                    <X style={{ width: '1rem', height: '1rem' }} />
                  </Button>
                </>
              ) : (
                <>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="color"
                      value={cat.color}
                      onChange={(e) => {
                        handleColorChange(e.target.value, cat.name, () => {
                          updateCategoryMutation.mutate({ id: cat.id, color: e.target.value });
                        });
                      }}
                      style={{
                        position: 'absolute',
                        width: '32px',
                        height: '32px',
                        opacity: 0,
                        cursor: 'pointer',
                      }}
                      title="Farbe ändern"
                    />
                    <span
                      style={{
                        display: 'block',
                        width: '24px',
                        height: '24px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: cat.color,
                        cursor: 'pointer',
                        border: '2px solid transparent',
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                    />
                  </div>
                  <span style={{ flex: 1, fontWeight: 500 }}>{cat.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCategory({ id: cat.id, name: cat.name, color: cat.color })}
                    title="Umbenennen"
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Kategorie "${cat.name}" löschen?`)) {
                        deleteCategoryMutation.mutate({ id: cat.id });
                      }
                    }}
                    title="Löschen"
                  >
                    <Trash2 style={{ width: '1rem', height: '1rem', color: 'var(--color-destructive)' }} />
                  </Button>
                </>
              )}
            </div>
          ))}

          {/* Default categories (color editable) */}
          <div style={{
            marginTop: 'var(--space-3)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-border)',
          }}>
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-muted-foreground)',
              marginBottom: 'var(--space-2)',
            }}>
              Standard-Kategorien (Farbe änderbar, nicht löschbar)
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {DEFAULT_CATEGORY_NAMES.map((name) => {
                const color = categoriesData?.colorMap?.[name] || '#6b7280';
                return (
                  <div
                    key={name}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      padding: 'var(--space-1) var(--space-2)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)',
                      backgroundColor: `${color}20`,
                      color: color,
                      border: `1px solid ${color}40`,
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          handleColorChange(e.target.value, name, () => {
                            updateDefaultColorMutation.mutate({ name, color: e.target.value });
                          });
                        }}
                        style={{
                          position: 'absolute',
                          width: '16px',
                          height: '16px',
                          opacity: 0,
                          cursor: 'pointer',
                        }}
                        title="Farbe ändern"
                      />
                      <span
                        style={{
                          display: 'block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                    {name}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={(rememberSession) => {
          setShowPinModal(false);
          refetchHasPin();
          if (rememberSession) {
            unlock(rememberSession);
          }
        }}
        mode={pinModalMode}
      />
    </div>
  );
}
