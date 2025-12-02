'use client';

import styles from './pin-modal.module.css';

interface PinRecoveryKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function PinRecoveryKeyInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: PinRecoveryKeyInputProps) {
  return (
    <div className={styles.recoveryKeyContainer}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Sicherheitscode eingeben..."
        className={styles.recoveryKeyInput}
        autoFocus
      />
      <button
        className={styles.submitButton}
        onClick={onSubmit}
        disabled={!value.trim() || isLoading}
      >
        {isLoading ? (
          <span className={styles.buttonContent}>
            <span className={styles.buttonSpinner}></span>
            Überprüfe...
          </span>
        ) : (
          'Weiter'
        )}
      </button>
    </div>
  );
}
