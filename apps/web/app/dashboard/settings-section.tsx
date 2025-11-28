'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Shield, Lock, Unlock } from 'lucide-react';
import { PinModal } from './pin-modal';
import { usePinContext } from './pin-context';
import dialogStyles from './dialog.module.css';

export function SettingsSection() {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'change' | 'recovery'>('setup');
  const { hasPin, unlock, refetchHasPin } = usePinContext();

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
