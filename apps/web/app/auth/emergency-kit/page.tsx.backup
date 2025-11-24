'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

  const handleCopy = () => {
    if (recoveryKey) {
      navigator.clipboard.writeText(recoveryKey);
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-8 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Save Your Recovery Key
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              This is your only chance to save your recovery key!
            </p>
          </div>

          {/* Warning Box */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-3">
              Important Security Information
            </h2>
            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Your master password <strong>cannot be reset</strong> without this recovery key
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  If you lose both your master password and recovery key, <strong>all your data will be lost forever</strong>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Store this key in a safe place (safe, bank vault, or secure password manager)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Never share this key with anyone</span>
              </li>
            </ul>
          </div>

          {/* Recovery Key Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Recovery Key
            </label>
            <div className="relative">
              <div className="bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 font-mono text-lg text-center text-gray-900 dark:text-white break-all">
                {recoveryKey}
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 mr-3 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I have saved my recovery key in a secure location and understand that{' '}
                <strong>without it, I cannot recover my account</strong> if I forget my master password.
              </span>
            </label>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!confirmed}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Continue to Dashboard
          </button>

          <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            You can also view your recovery key later in Dashboard → Settings
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmergencyKitPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>}>
      <EmergencyKitContent />
    </Suspense>
  );
}
