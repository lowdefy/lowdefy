import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://lowdefy.com'),
  title: 'Lowdefy - Config-First Web Stack for AI and Humans',
  description:
    'Build full-stack web apps with YAML config. AI outputs production-ready code. Easy to review, secure by design, connects to any data source.',
  openGraph: {
    title: 'Lowdefy - Config-First Web Stack for AI and Humans',
    description:
      'Build full-stack web apps with YAML config. AI outputs production-ready code. Easy to review, secure by design.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
