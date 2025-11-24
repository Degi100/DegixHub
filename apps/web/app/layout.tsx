import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DegixHub',
  description: 'Your personal command center',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
