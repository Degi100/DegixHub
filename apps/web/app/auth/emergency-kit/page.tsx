'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { copyToClipboard } from '@/lib/clipboard';
import styles from '../auth.module.css';

function EmergencyKitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recoveryKey = searchParams.get('key');
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!recoveryKey) {
      router.push('/auth/login');
    }
  }, [recoveryKey, router]);

  const handleCopy = async () => {
    if (recoveryKey) {
      await copyToClipboard(recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = () => {
    if (!recoveryKey) return;

    // Create simple text file (PDF generation will come later)
    const content = `
DegixHub Emergency Kit
======================

IMPORTANT: Keep this recovery key in a safe place!
Without it, you cannot recover your account if you forget your master password.

Recovery Key:
${recoveryKey}

Generated: ${new Date().toLocaleString()}

Instructions:
1. Print this document and store it in a safe place
2. OR save this file to a USB drive and store it securely
3. Do NOT share this key with anyone
4. Do NOT store it in cloud storage without additional encryption

If you forget your master password:
1. Go to https://hub.reneschmidt.de/auth/forgot-password
2. Enter your recovery key
3. Set a new master password
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `degixhub-recovery-key-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContinue = () => {
    if (confirmed) {
      router.push('/dashboard');
    }
  };

  if (!recoveryKey) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardInner}>
          {/* Header with Icon */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div className={`${styles.iconCircle} ${styles['iconCircle--yellow']}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className={styles.title}>Save Your Recovery Key</h1>
            <p className={styles.subtitle}>
              This is your only chance to save your recovery key!
            </p>
          </div>

          {/* Warning Box */}
          <div className={styles.warningBox}>
            <h2 className={styles.warningTitle}>
              Important Security Information
            </h2>
            <ul className={styles.warningList}>
              <li>
                <span>•</span>
                <span>
                  Your master password <strong>cannot be reset</strong> without this recovery key
                </span>
              </li>
              <li>
                <span>•</span>
                <span>
                  If you lose both your master password and recovery key, <strong>all your data will be lost forever</strong>
                </span>
              </li>
              <li>
                <span>•</span>
                <span>Store this key in a safe place (safe, bank vault, or secure password manager)</span>
              </li>
              <li>
                <span>•</span>
                <span>Never share this key with anyone</span>
              </li>
            </ul>
          </div>

          {/* Recovery Key Display */}
          <div className={styles.formField}>
            <label className={styles.label}>
              Your Recovery Key
            </label>
            <div className={styles.recoveryKeyBox}>
              <div className={styles.recoveryKeyDisplay}>
                {recoveryKey}
              </div>
              <button
                onClick={handleCopy}
                className={`${styles.copyButton} ${copied ? styles['copyButton--copied'] : ''}`}
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actionRow}>
            <button
              onClick={handleDownloadPDF}
              className={`${styles.actionButton} ${styles['actionButton--primary']}`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Emergency Kit
            </button>
            <button
              onClick={handleCopy}
              className={`${styles.actionButton} ${styles['actionButton--secondary']}`}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied ? 'Copied!' : 'Copy Key'}
            </button>
          </div>

          {/* Confirmation Checkbox */}
          <div className={styles.confirmationBox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>
                I have saved my recovery key in a secure location and understand that{' '}
                <strong>without it, I cannot recover my account</strong> if I forget my master password.
              </span>
            </label>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!confirmed}
            className={styles.successButton}
          >
            Continue to Dashboard
          </button>

          <p style={{
            marginTop: 'var(--space-4)',
            textAlign: 'center',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-muted-foreground)'
          }}>
            You can also view your recovery key later in Dashboard → Settings
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmergencyKitPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div style={{ color: 'var(--color-muted-foreground)' }}>Loading...</div>
      </div>
    }>
      <EmergencyKitContent />
    </Suspense>
  );
}
