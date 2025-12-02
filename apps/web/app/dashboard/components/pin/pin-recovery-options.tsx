'use client';

import styles from './pin-modal.module.css';

interface PinRecoveryOptionsProps {
  onRecoveryKeySelect: () => void;
  onBack: () => void;
}

export function PinRecoveryOptions({ onRecoveryKeySelect, onBack }: PinRecoveryOptionsProps) {
  return (
    <div className={styles.recoveryOptions}>
      <button
        className={styles.recoveryButton}
        onClick={onRecoveryKeySelect}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>
        <span>Mit Sicherheitscode zurücksetzen</span>
      </button>
      <button className={styles.recoveryButtonDisabled} disabled>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <span>Per E-Mail zurücksetzen (bald verfügbar)</span>
      </button>
      <button
        className={styles.backButton}
        onClick={onBack}
      >
        Zurück
      </button>
    </div>
  );
}
