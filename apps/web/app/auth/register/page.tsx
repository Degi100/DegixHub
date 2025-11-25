'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/react';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Use relative URL in production, localhost in development
      const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:3003/auth/register'
        : '/api/auth/register';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Set the cookie via API call
      await fetch('/api/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: data.result.data.sessionCookie }),
      });

      // Invalidate session query to refetch with new cookie
      await utils.auth.getSession.invalidate();

      // Navigate to Emergency Kit page with recovery key
      router.push(`/auth/emergency-kit?key=${encodeURIComponent(data.result.data.recoveryKey)}`);
    } catch (err) {
      console.error('Registration error:', err);
      setError('An error occurred during registration');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join DegixHub</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            <div className={styles.formField}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className={styles.input}
                placeholder="Enter username"
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={styles.input}
                placeholder="Enter password (min 8 characters)"
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={styles.input}
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className={styles.footerText}>
            Already have an account?{' '}
            <Link href="/auth/login" className={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
