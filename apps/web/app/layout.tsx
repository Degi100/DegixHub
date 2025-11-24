import type { Metadata } from 'next';
import { TRPCProvider } from '@/lib/trpc/react';
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
      <body className="antialiased">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
