/**
 * Root Layout
 * 
 * Next.js App Router root layout with providers and metadata.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

// Configure Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Metadata configuration
export const metadata: Metadata = {
  title: {
    default: 'Validiant - Project Management Platform',
    template: '%s | Validiant',
  },
  description:
    'Modern project management platform for teams. Organize projects, track tasks, and collaborate effectively.',
  keywords: [
    'project management',
    'task tracking',
    'team collaboration',
    'productivity',
    'workflow management',
  ],
  authors: [{ name: 'Validiant Team' }],
  creator: 'Validiant',
  publisher: 'Validiant',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://validiant.com',
    siteName: 'Validiant',
    title: 'Validiant - Project Management Platform',
    description:
      'Modern project management platform for teams. Organize projects, track tasks, and collaborate effectively.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Validiant Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Validiant - Project Management Platform',
    description:
      'Modern project management platform for teams. Organize projects, track tasks, and collaborate effectively.',
    images: ['/twitter-image.png'],
    creator: '@validiant',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

/**
 * Root Layout Component
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Additional meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
