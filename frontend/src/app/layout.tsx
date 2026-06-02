import type { Metadata } from 'next';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}
