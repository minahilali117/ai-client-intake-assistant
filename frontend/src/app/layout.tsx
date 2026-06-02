import type { Metadata } from 'next';
import './globals.css';
import { OfflineProvider } from '@/components/providers/offline-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Client Intake & Proposal Assistant',
  description:
    'Internal tool for managing client inquiries and generating proposal briefs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <OfflineProvider>{children}</OfflineProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
