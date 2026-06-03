import type { Metadata } from 'next';
import './globals.css';
import { AuthSyncProvider } from '@/components/providers/auth-sync-provider';
import { OfflineProvider } from '@/components/providers/offline-provider';
import { AppSessionProvider } from '@/components/providers/session-provider';
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
        <AppSessionProvider>
          <AuthSyncProvider>
            <OfflineProvider>{children}</OfflineProvider>
          </AuthSyncProvider>
        </AppSessionProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
