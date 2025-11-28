import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <h1 className={styles.title}>DegixHub</h1>
        <p className={styles.subtitle}>
          Your personal command center
        </p>

        <div className={styles.buttons}>
          <Link href="/auth/login" className={styles.primaryButton}>
            Sign In
          </Link>
          <Link href="/auth/register" className={styles.secondaryButton}>
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
