
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// GeistSans and GeistMono imported from 'geist/font/*' provide .variable and .className directly.
// No need to instantiate them like with next/font/google.

export const metadata: Metadata = {
  title: 'Bias X-Ray',
  description: 'Audit, Detect, and Fix AI Bias in text content.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
